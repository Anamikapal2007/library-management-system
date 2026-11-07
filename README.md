# Library Desk

A small library management system with a responsive browser interface, an installable progressive web app (PWA), and a Kotlin console program.

The browser app uses separate views for Dashboard, Book Catalog, Active Loans, Search Books, Issue a Book, Return a Book, Add New Book, and Policy & Guidelines. Select a destination in the sidebar; browser back/forward navigation works between views.

## Browser app

Open `index.html` directly for local use. Books and loan history are stored in that browser's local storage, so they remain available in later visits on the same browser and device. The interface supports:

- Adding books with unique IDs and validated publication years and copy counts.
- Listing and searching books by ID or title.
- Issuing a copy to a student and returning it only against that student's active issue.
- Viewing all currently issued books.

To install it as a phone or desktop app and enable offline loading, serve this folder from `localhost` or an HTTPS static host. On a supported browser, use **Install app** or the browser's **Add to Home Screen** option. For local hosting, from this folder run `python -m http.server 8000` and open `http://localhost:8000`. For a public site, publish the folder contents to any static HTTPS host such as GitHub Pages.

The PWA caches its interface files for offline loading. Catalog and issue data remain in browser local storage; they are not synchronized across devices or shared with other librarians.

## Kotlin console app

Run `kotlinc main.kt -include-runtime -d library.jar` and then `java -jar library.jar` (JDK and Kotlin compiler required). The numbered menu uses Kotlin's `when` expression and keeps its catalog and transactions in memory for the current run. It supports add, list, search, issue, return, currently issued, and exit.

## Data rules

Book IDs are unique without regard to letter case. Required text fields cannot be blank; publication years must be from 1 through the current year; copy counts must be non-negative whole numbers. Issuing requires an existing book and an available copy. Returning requires a matching active book/student transaction. Returned records remain in transaction history but are omitted from the active list.
