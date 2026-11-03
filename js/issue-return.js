
// Admin-only access protection
if (
    localStorage.getItem("loggedIn") !== "true" ||
    localStorage.getItem("userRole") !== "admin"
) {
    alert("Only Admin can access Issue & Return Management.");
    window.location.replace("index.html");
    throw new Error("Admin access required.");
}

// Existing data
let books = JSON.parse(localStorage.getItem("libraFlowBooks") || "[]");
let students = JSON.parse(localStorage.getItem("libraFlowStudents") || "[]");
let transactions = JSON.parse(localStorage.getItem("libraFlowTransactions") || "[]");

// HTML elements
const issueForm = document.getElementById("issueForm");
const issueStudent = document.getElementById("issueStudent");
const issueBook = document.getElementById("issueBook");
const issueDate = document.getElementById("issueDate");
const dueDate = document.getElementById("dueDate");

const transactionTable = document.getElementById("transactionTable");
const searchRecords = document.getElementById("searchRecords");
const statusFilter = document.getElementById("statusFilter");

// Today's date in local time
function getToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// Date helper: use UTC calendar dates to avoid timezone errors
function dateToUTC(dateString) {
    const [year, month, day] = dateString.split("-").map(Number);
    return Date.UTC(year, month - 1, day);
}

// Save all data
function saveAllData() {
    localStorage.setItem("libraFlowBooks", JSON.stringify(books));
    localStorage.setItem("libraFlowTransactions", JSON.stringify(transactions));
}

// Safe HTML output
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function(char) {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[char];
    });
}

// Fill student dropdown
function loadStudents() {
    issueStudent.innerHTML = '<option value="">Select Student</option>';

    students
        .filter(student => student.status === "Active")
        .forEach(student => {
            const option = document.createElement("option");
            option.value = student.id;
            option.textContent = `${student.name} (${student.studentId})`;
            issueStudent.appendChild(option);
        });
}

// Fill available books dropdown
function loadBooks() {
    issueBook.innerHTML = '<option value="">Select Book</option>';

    books
        .filter(book => Number(book.available) > 0)
        .forEach(book => {
            const option = document.createElement("option");
            option.value = book.id;
            option.textContent = `${book.title} (${book.available} available)`;
            issueBook.appendChild(option);
        });
}

// Update statistics
function updateStatistics() {
    const issued = transactions.filter(
        transaction => transaction.status === "Issued"
    );

    const returned = transactions.filter(
        transaction => transaction.status === "Returned"
    );

    const today = getToday();

    const overdue = issued.filter(
        transaction => transaction.dueDate < today
    );

    const totalFine = transactions.reduce(
        (sum, transaction) => sum + Number(transaction.fine || 0),
        0
    );

    document.getElementById("totalIssued").textContent = issued.length;
    document.getElementById("totalReturned").textContent = returned.length;
    document.getElementById("totalOverdue").textContent = overdue.length;
    document.getElementById("totalFine").textContent = `₹${totalFine}`;
}

// Display transactions
function displayTransactions() {
    const searchValue = searchRecords.value.toLowerCase().trim();
    const selectedStatus = statusFilter.value;

    const filtered = transactions.filter(transaction => {
        const student = students.find(
            item => item.id === transaction.studentId
        );

        const book = books.find(
            item => item.id === transaction.bookId
        );

        const studentName = student ? student.name : transaction.studentName;
        const bookTitle = book ? book.title : transaction.bookTitle;

        const matchesSearch =
            studentName.toLowerCase().includes(searchValue) ||
            bookTitle.toLowerCase().includes(searchValue);

        const matchesStatus =
            selectedStatus === "" ||
            transaction.status === selectedStatus;

        return matchesSearch && matchesStatus;
    });

    if (filtered.length === 0) {
        transactionTable.innerHTML = `
            <tr>
                <td colspan="8" class="empty">No transactions found.</td>
            </tr>
        `;
    } else {
        transactionTable.innerHTML = filtered.map(transaction => {
            const student = students.find(
                item => item.id === transaction.studentId
            );

            const book = books.find(
                item => item.id === transaction.bookId
            );

            const studentName = student ? student.name : transaction.studentName;
            const bookTitle = book ? book.title : transaction.bookTitle;

            const isOverdue =
                transaction.status === "Issued" &&
                transaction.dueDate < getToday();

            const statusText = isOverdue ? "Overdue" : transaction.status;

            return `
                <tr>
                    <td>${escapeHTML(studentName)}</td>
                    <td>${escapeHTML(bookTitle)}</td>
                    <td>${escapeHTML(transaction.issueDate)}</td>
                    <td>${escapeHTML(transaction.dueDate)}</td>
                    <td>${escapeHTML(transaction.returnDate || "-")}</td>
                    <td>₹${Number(transaction.fine || 0)}</td>
                    <td class="${isOverdue ? "overdue-label" : transaction.status === "Returned" ? "returned-label" : ""}">
                        ${statusText}
                    </td>
                    <td>
                        ${transaction.status === "Issued" ? `
                            <button class="return-btn"
                                data-action="return"
                                data-id="${escapeHTML(transaction.id)}">
                                Return
                            </button>
                        ` : "Completed"}
                    </td>
                </tr>
            `;
        }).join("");
    }

    updateStatistics();
}

// Issue book
issueForm.addEventListener("submit", function(event) {
    event.preventDefault();

    // Refresh existing data before processing
    books = JSON.parse(localStorage.getItem("libraFlowBooks") || "[]");
    students = JSON.parse(localStorage.getItem("libraFlowStudents") || "[]");

    const selectedStudent = students.find(
        student => student.id === issueStudent.value
    );

    const selectedBook = books.find(
        book => book.id === issueBook.value
    );

    const issueDateValue = issueDate.value;
    const dueDateValue = dueDate.value;

    if (!selectedStudent || selectedStudent.status !== "Active") {
        alert("Please select a valid active student.");
        return;
    }

    if (!selectedBook || Number(selectedBook.available) < 1) {
        alert("This book is not available.");
        return;
    }

    if (
        !issueDateValue ||
        !dueDateValue ||
        dueDateValue <= issueDateValue ||
        issueDateValue !== getToday()
    ) {
        alert("Issue date must be today and due date must be after issue date.");
        return;
    }

    const activeIssues = transactions.filter(
        transaction =>
            transaction.studentId === selectedStudent.id &&
            transaction.status === "Issued"
    );

    if (activeIssues.length >= 3) {
        alert("A student can have a maximum of 3 books issued at a time.");
        return;
    }

    const alreadyHasBook = activeIssues.some(
        transaction => transaction.bookId === selectedBook.id
    );

    if (alreadyHasBook) {
        alert("This student already has this book issued.");
        return;
    }

    const transaction = {
        id: Date.now().toString(),
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        bookId: selectedBook.id,
        bookTitle: selectedBook.title,
        issueDate: issueDateValue,
        dueDate: dueDateValue,
        returnDate: "",
        fine: 0,
        status: "Issued"
    };

    selectedBook.available = Number(selectedBook.available) - 1;

    transactions.push(transaction);

    saveAllData();

    alert("Book issued successfully!");

    issueForm.reset();
    setDefaultIssueDate();
    loadBooks();
    displayTransactions();
});

// Return book
transactionTable.addEventListener("click", function(event) {
    const button = event.target.closest('button[data-action="return"]');

    if (!button) return;

    const transaction = transactions.find(
        item => item.id === button.dataset.id
    );

    if (!transaction || transaction.status !== "Issued") return;

    const confirmReturn = confirm("Confirm book return?");

    if (!confirmReturn) return;

    const returnDate = getToday();

    const lateDays = Math.max(
        0,
        Math.floor(
            (dateToUTC(returnDate) - dateToUTC(transaction.dueDate)) /
            (24 * 60 * 60 * 1000)
        )
    );

    const fine = lateDays * 5;

    const book = books.find(
        item => item.id === transaction.bookId
    );

    if (!book) {
        alert("Original book record not found. Please check the book records.");
        return;
    }

    transaction.returnDate = returnDate;
    transaction.fine = fine;
    transaction.status = "Returned";

    book.available = Math.min(
        Number(book.quantity),
        Number(book.available) + 1
    );

    saveAllData();

    alert(
        `Book returned successfully!\nLate days: ${lateDays}\nFine: ₹${fine}`
    );

    loadBooks();
    displayTransactions();
});

// Search and filter
searchRecords.addEventListener("input", displayTransactions);
statusFilter.addEventListener("change", displayTransactions);

// Default issue date
function setDefaultIssueDate() {
    const today = getToday();

    issueDate.value = today;
    issueDate.min = today;
    issueDate.max = today;

    dueDate.min = today;
    dueDate.value = "";
}

// Initial setup
setDefaultIssueDate();
loadStudents();
loadBooks();
displayTransactions();
