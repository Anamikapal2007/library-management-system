(() => {
  "use strict";
  const BOOKS_KEY = "libraryDesk.books.v1";
  const LOANS_KEY = "libraryDesk.loans.v1";
  const currentYear = new Date().getFullYear();
  const $ = (selector) => document.querySelector(selector);
  const read = (key, fallback) => {
    try { const value = JSON.parse(localStorage.getItem(key)); return Array.isArray(value) ? value : fallback; }
    catch { return fallback; }
  };
  let books = read(BOOKS_KEY, []);
  let loans = read(LOANS_KEY, []);
  let activeQuery = "";

  // Small demo catalog is created only on the first launch in this browser.
  // Restore the starter catalog if an earlier empty save left no books behind.
  if (!localStorage.getItem(BOOKS_KEY) || (books.length === 0 && loans.length === 0)) {
    books = [
      { id: "B001", title: "The Hobbit", author: "J.R.R. Tolkien", year: 1937, copies: 4 },
      { id: "B002", title: "Pride and Prejudice", author: "Jane Austen", year: 1813, copies: 2 },
      { id: "B003", title: "Clean Code", author: "Robert C. Martin", year: 2008, copies: 1 }
    ];
    save();
  }

  function save() {
    localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
    localStorage.setItem(LOANS_KEY, JSON.stringify(loans));
  }
  function clean(value) { return String(value ?? "").trim(); }
  function showMessage(message, kind = "success") {
    const box = $("#message");
    box.textContent = message;
    box.className = `message ${kind}`;
    box.hidden = false;
    window.clearTimeout(showMessage.timer);
    showMessage.timer = window.setTimeout(() => { box.hidden = true; }, 5000);
    box.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  function activeLoans() { return loans.filter((loan) => loan.status === "ISSUED"); }
  function cell(tag, value, className) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    node.textContent = value;
    return node;
  }
  function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
  }
  function renderOverview() {
    const active = activeLoans();
    const available = books.reduce((total, book) => total + book.copies, 0);
    const total = available + active.length;
    const percent = total ? Math.round((available / total) * 100) : 100;
    const out = books.filter((book) => book.copies === 0).length;
    $("#hero-loans").textContent = String(active.length);
    $("#sidebar-book-count").textContent = String(books.length);
    $("#sidebar-loan-count").textContent = String(active.length);
    $("#out-count").textContent = String(out);
    $("#stock-percent").textContent = `${percent}%`;
    $("#health-percent").textContent = `${percent}%`;
    $("#health-bar").style.width = `${percent}%`;
    $("#sidebar-meter").style.width = `${percent}%`;
    $("#health-title").textContent = out ? "Restock Attention Needed" : "Optimal Circulation Health";
    $("#health-summary").textContent = `${available} physical copies ready on shelves. ${active.length} active ${active.length === 1 ? "loan" : "loans"} in circulation.`;
    $("#sidebar-inventory").textContent = `${books.length} titles · ${available} copies in stock`;
  }
  function renderBooks() {
    const drawRows = (body, items, emptyMessage) => {
      body.replaceChildren();
      if (!items.length) {
        const row = document.createElement("tr");
        const empty = cell("td", emptyMessage, "empty");
        empty.colSpan = 6; row.append(empty); body.append(row); return;
      }
      items.forEach((book) => {
        const row = document.createElement("tr");
        row.append(cell("td", book.id), cell("td", book.title, "book-title"), cell("td", book.author), cell("td", String(book.year)), cell("td", String(book.copies)));
        const status = cell("span", book.copies > 0 ? "Available" : "Out of Stock", `availability ${book.copies > 0 ? "available" : "out"}`);
        const statusCell = document.createElement("td"); statusCell.append(status); row.append(statusCell); body.append(row);
      });
    };
    drawRows($("#books-body"), books, "No books registered yet.");
    const query = activeQuery.toLowerCase();
    const matches = query ? books.filter((book) => book.id.toLowerCase() === query || book.title.toLowerCase().includes(query) || book.author.toLowerCase().includes(query)) : [];
    drawRows($("#search-body"), matches, query ? "No matching book found." : "Enter a title, author, or book ID in the search bar above.");
    $("#search-heading").textContent = query ? `Search results (${matches.length})` : "Search results";
    $("#search-helper").textContent = query ? `Showing matches for “${activeQuery}”.` : "Enter a query in the search bar above.";
    $("#book-count").textContent = String(books.length);
    $("#copy-count").textContent = String(books.reduce((total, book) => total + book.copies, 0));
  }
  function renderLoans() {
    const body = $("#issued-body");
    const active = activeLoans();
    body.replaceChildren();
    $("#loan-count").textContent = String(active.length);
    $("#active-label").textContent = `${active.length} active`;
    if (!active.length) {
      const row = document.createElement("tr"); const empty = cell("td", "No books are currently issued.", "empty");
      empty.colSpan = 7; row.append(empty); body.append(row); renderActivity(); return;
    }
    active.forEach((loan) => {
      const book = books.find((item) => item.id === loan.bookId);
      const row = document.createElement("tr");
      row.append(cell("td", `LN-${String(loans.indexOf(loan) + 1).padStart(3, "0")}`), cell("td", loan.bookId), cell("td", book?.title ?? "Book removed", "book-title"), cell("td", loan.studentId), cell("td", formatDate(loan.issuedAt)));
      const statusCell = document.createElement("td"); statusCell.append(cell("span", "ISSUED", "status-chip")); row.append(statusCell);
      const actionCell = document.createElement("td");
      const action = cell("button", "Record return", "return-action"); action.type = "button"; action.dataset.bookId = loan.bookId; action.dataset.studentId = loan.studentId; actionCell.append(action); row.append(actionCell);
      body.append(row);
    });
    renderActivity();
  }
  function renderActivity() {
    const stream = $("#activity-stream");
    const history = loans.slice().reverse().slice(0, 8);
    stream.replaceChildren();
    if (!history.length) {
      const item = document.createElement("div"); item.className = "activity-item";
      item.append(cell("i", ""));
      const details = document.createElement("div"); details.append(cell("strong", "Catalog is ready"), cell("p", "Book and lending activity will appear here."), cell("small", "Current status")); item.append(details); stream.append(item); return;
    }
    history.forEach((loan) => {
      const book = books.find((item) => item.id === loan.bookId);
      const isReturned = loan.status === "RETURNED";
      const item = document.createElement("div"); item.className = "activity-item";
      item.append(cell("i", ""));
      const details = document.createElement("div");
      details.append(cell("strong", `${isReturned ? "Book returned" : "Book issued"}: ${book?.title ?? loan.bookId}`));
      details.append(cell("p", `${isReturned ? "Returned by" : "Issued to"} ${loan.studentId}`));
      details.append(cell("small", formatDate(isReturned ? loan.returnedAt : loan.issuedAt)));
      item.append(details); stream.append(item);
    });
  }
  function render() { renderBooks(); renderLoans(); renderOverview(); }

  function exportCatalog() {
    const rows = [["Book ID", "Title", "Author", "Publication Year", "Available Copies", "Availability"], ...books.map((book) => [book.id, book.title, book.author, book.year, book.copies, book.copies > 0 ? "Available" : "Out of Stock"])];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "library-catalog.csv"; link.click(); URL.revokeObjectURL(url);
    showMessage("Catalog CSV exported.");
  }
  document.querySelectorAll("[data-export], #export-sidebar").forEach((button) => button.addEventListener("click", exportCatalog));
  function updateActiveNavigation() {
    const requested = (location.hash || "#dashboard").slice(1);
    const current = document.querySelector(`#page-${CSS.escape(requested)}`) ? requested : "dashboard";
    document.querySelectorAll(".page-view").forEach((page) => { page.hidden = page.id !== `page-${current}`; });
    document.querySelectorAll(".nav-link").forEach((link) => link.classList.toggle("active", link.dataset.page === current));
    const activeLink = document.querySelector(`.nav-link[data-page="${CSS.escape(current)}"]`);
    document.title = `${activeLink?.textContent.trim() || "Dashboard"} — Athenaeum OS`;
  }
  window.addEventListener("hashchange", updateActiveNavigation);
  $("#issued-body").addEventListener("click", (event) => {
    const action = event.target.closest(".return-action");
    if (!action) return;
    $("#return-form").elements.bookId.value = action.dataset.bookId;
    $("#return-form").elements.studentId.value = action.dataset.studentId;
    location.hash = "return";
    showMessage(`Ready to record the return for ${action.dataset.bookId} / ${action.dataset.studentId}.`);
  });

  $("#refresh-data").addEventListener("click", () => {
    books = read(BOOKS_KEY, []); loans = read(LOANS_KEY, []); render(); showMessage("Library data refreshed from this browser.");
  });

  $("#add-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const id = clean(form.get("id")).toUpperCase();
    const title = clean(form.get("title"));
    const author = clean(form.get("author"));
    const year = Number(form.get("year"));
    const copies = Number(form.get("copies"));
    if (!id || !title || !author) return showMessage("Book ID, title and author are required.", "error");
    if (books.some((book) => book.id.toUpperCase() === id)) return showMessage(`Book ID ${id} already exists.`, "error");
    if (!Number.isInteger(year) || year < 1 || year > currentYear) return showMessage(`Enter a publication year from 1 to ${currentYear}.`, "error");
    if (!Number.isSafeInteger(copies) || copies < 0) return showMessage("Available copies must be a non-negative whole number.", "error");
    books.push({ id, title, author, year, copies }); save(); activeQuery = ""; render(); event.currentTarget.reset();
    showMessage(`“${title}” was added successfully.`);
  });

  $("#search-form").addEventListener("submit", (event) => {
    event.preventDefault(); activeQuery = clean(new FormData(event.currentTarget).get("query")); renderBooks(); location.hash = "search";
    if (activeQuery && !books.some((book) => book.id.toLowerCase() === activeQuery.toLowerCase() || book.title.toLowerCase().includes(activeQuery.toLowerCase()) || book.author.toLowerCase().includes(activeQuery.toLowerCase()))) showMessage("No book matched that ID, title, or author.", "error");
  });
  const clearSearch = () => { activeQuery = ""; $("#query").value = ""; renderBooks(); };
  $("#clear-search").addEventListener("click", clearSearch);
  $("#clear-search-results").addEventListener("click", clearSearch);

  $("#issue-form").addEventListener("submit", (event) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const id = clean(form.get("bookId")).toUpperCase(); const studentId = clean(form.get("studentId"));
    const book = books.find((item) => item.id === id);
    if (!studentId) return showMessage("Student ID is required.", "error");
    if (!book) return showMessage(`Book ID ${id || "(blank)"} was not found.`, "error");
    if (book.copies < 1) return showMessage(`“${book.title}” is out of stock.`, "error");
    book.copies -= 1; loans.push({ bookId: id, studentId, status: "ISSUED", issuedAt: new Date().toISOString() });
    save(); render(); event.currentTarget.reset(); showMessage(`“${book.title}” was issued to ${studentId}.`);
  });

  $("#return-form").addEventListener("submit", (event) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const id = clean(form.get("bookId")).toUpperCase(); const studentId = clean(form.get("studentId"));
    const record = [...loans].reverse().find((loan) => loan.bookId === id && loan.studentId.toLowerCase() === studentId.toLowerCase() && loan.status === "ISSUED");
    if (!studentId) return showMessage("Student ID is required.", "error");
    if (!record) return showMessage(`No active issue was found for ${id || "that book"} and student ${studentId}.`, "error");
    const book = books.find((item) => item.id === id);
    if (!book) return showMessage("The book record could not be found.", "error");
    record.status = "RETURNED"; record.returnedAt = new Date().toISOString(); book.copies += 1;
    save(); render(); event.currentTarget.reset(); showMessage(`“${book.title}” was returned by ${studentId}.`);
  });

  // Browsers expose the install prompt only when the app is served securely
  // (HTTPS or localhost) and meets their PWA requirements.
  let installPrompt = null;
  const installButton = $("#install-app");
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    installButton.hidden = false;
  });
  installButton.addEventListener("click", async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    installButton.hidden = true;
  });
  window.addEventListener("appinstalled", () => {
    installPrompt = null;
    installButton.hidden = true;
    showMessage("Library Desk was installed successfully.");
  });

  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
  }

  updateActiveNavigation();
  render();
})();
