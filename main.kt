import java.time.Year

// Data classes represent the main items managed by the library.
data class Book(val id: String, val title: String, val author: String, val year: Int, var availableCopies: Int)
data class Student(val id: String)
data class IssueRecord(val bookId: String, val studentId: String, var status: String = "ISSUED")

// All console operations use this in-memory collection and these shared rules.
class LibraryManager {
    private val books = linkedMapOf<String, Book>()
    private val issueRecords = mutableListOf<IssueRecord>()

    fun addBook(id: String, title: String, author: String, year: Int, copies: Int) {
        val key = id.trim().uppercase()
        require(key.isNotBlank()) { "Book ID cannot be blank." }
        require(key !in books) { "Book ID '$key' already exists." }
        require(title.isNotBlank()) { "Book title cannot be blank." }
        require(author.isNotBlank()) { "Author name cannot be blank." }
        require(year in 1..Year.now().value) { "Enter a valid publication year (1-${Year.now().value})." }
        require(copies >= 0) { "Available copies cannot be negative." }
        books[key] = Book(key, title.trim(), author.trim(), year, copies)
    }

    fun allBooks(): List<Book> = books.values.toList()
    fun search(query: String): List<Book> = books.values.filter {
        it.id.equals(query.trim(), ignoreCase = true) || it.title.contains(query.trim(), ignoreCase = true)
    }

    fun issueBook(bookId: String, studentId: String) {
        val key = bookId.trim().uppercase()
        require(studentId.isNotBlank()) { "Student ID cannot be blank." }
        val book = books[key] ?: throw IllegalArgumentException("Book '$key' was not found.")
        require(book.availableCopies > 0) { "Book '$key' is out of stock." }
        book.availableCopies--
        issueRecords.add(IssueRecord(key, Student(studentId.trim()).id))
    }

    fun returnBook(bookId: String, studentId: String) {
        val key = bookId.trim().uppercase()
        val student = studentId.trim()
        require(student.isNotBlank()) { "Student ID cannot be blank." }
        val record = issueRecords.lastOrNull {
            it.bookId == key && it.studentId.equals(student, ignoreCase = true) && it.status == "ISSUED"
        } ?: throw IllegalArgumentException("No outstanding issue matches this book and student.")
        record.status = "RETURNED"
        books.getValue(key).availableCopies++
    }

    fun currentlyIssued(): List<Pair<Book, IssueRecord>> = issueRecords
        .filter { it.status == "ISSUED" }
        .mapNotNull { record -> books[record.bookId]?.let { it to record } }
}

private fun prompt(label: String): String { print(label); return readLine()?.trim().orEmpty() }
private fun printBookTable(items: List<Book>) {
    if (items.isEmpty()) { println("No books registered or found."); return }
    println("%-10s | %-28s | %-22s | %4s | %6s | %s".format("BOOK ID", "TITLE", "AUTHOR", "YEAR", "COPIES", "STATUS"))
    println("-".repeat(100))
    items.forEach { book ->
        val status = if (book.availableCopies > 0) "Available" else "Out of Stock"
        println("%-10s | %-28s | %-22s | %4d | %6d | %s".format(book.id.take(10), book.title.take(28), book.author.take(22), book.year, book.availableCopies, status))
    }
}

fun main() {
    val library = LibraryManager()
    while (true) {
        println("""

        ===== Library Management System =====
        1. Add a new book
        2. Display all books
        3. Search for a book
        4. Issue a book
        5. Return a book
        6. Display currently issued books
        7. Exit
        """.trimIndent())
        try {
            when (prompt("Choose an option: ")) {
                "1" -> {
                    val id = prompt("Book ID: "); val title = prompt("Book title: "); val author = prompt("Author name: ")
                    val year = prompt("Publication year: ").toIntOrNull() ?: throw IllegalArgumentException("Year must be a number.")
                    val copies = prompt("Available copies: ").toIntOrNull() ?: throw IllegalArgumentException("Copies must be a whole number.")
                    library.addBook(id, title, author, year, copies); println("Book added successfully.")
                }
                "2" -> printBookTable(library.allBooks())
                "3" -> {
                    val found = library.search(prompt("Enter book ID or title: "))
                    if (found.isEmpty()) println("Book not found.") else printBookTable(found)
                }
                "4" -> { library.issueBook(prompt("Book ID: "), prompt("Student ID: ")); println("Book issued successfully.") }
                "5" -> { library.returnBook(prompt("Book ID: "), prompt("Student ID: ")); println("Book returned successfully.") }
                "6" -> {
                    val records = library.currentlyIssued()
                    if (records.isEmpty()) println("No books are currently issued.") else {
                        println("%-10s | %-28s | %-18s | %s".format("BOOK ID", "TITLE", "STUDENT ID", "STATUS"))
                        println("-".repeat(72))
                        records.forEach { (book, record) -> println("%-10s | %-28s | %-18s | %s".format(book.id, book.title.take(28), record.studentId, record.status)) }
                    }
                }
                "7" -> { println("Goodbye."); return }
                else -> println("Choose an option from 1 to 7.")
            }
        } catch (error: IllegalArgumentException) { println("Error: ${error.message}") }
    }
}
