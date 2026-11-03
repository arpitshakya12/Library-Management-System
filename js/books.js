
// ===================================
// LIBRAFLOW - BOOK MANAGEMENT SYSTEM
// ADMIN: FULL ACCESS
// STUDENT: READ ONLY ACCESS
// ===================================

// Check login and role
const userRole = localStorage.getItem("userRole");

if (
    localStorage.getItem("loggedIn") !== "true" ||
    !["admin", "student"].includes(userRole)
) {
    window.location.replace("login.html");
    throw new Error("Unauthorized access.");
}

const isAdmin = userRole === "admin";

// Get HTML elements
const bookForm = document.getElementById("bookForm");
const formSection = document.getElementById("bookFormSection");
const addBookBtn = document.getElementById("addBookBtn");
const cancelBtn = document.getElementById("cancelBtn");

const bookTableBody = document.getElementById("bookTableBody");
const searchInput = document.getElementById("searchInput");
const filterCategory = document.getElementById("filterCategory");

// Load saved books
let books = [];

try {
    books = JSON.parse(
        localStorage.getItem("libraFlowBooks") || "[]"
    );

    if (!Array.isArray(books)) books = [];
} catch {
    books = [];
}

let editingBookId = null;

// Save books - Admin only
function saveBooks() {
    if (!isAdmin) {
        alert("Students cannot modify library books.");
        return;
    }

    localStorage.setItem(
        "libraFlowBooks",
        JSON.stringify(books)
    );
}

// Safe text display
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function(char) {
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

// Admin: Show Add Book Form
if (isAdmin) {
    addBookBtn.addEventListener("click", function() {

        editingBookId = null;

        bookForm.reset();

        document.getElementById("formTitle").textContent =
            "Add New Book";

        document.getElementById("formMessage").textContent = "";

        formSection.classList.remove("hidden");

        formSection.scrollIntoView({
            behavior: "smooth"
        });
    });

    // Admin: Hide Form
    cancelBtn.addEventListener("click", function() {

        formSection.classList.add("hidden");

        bookForm.reset();

        editingBookId = null;
    });

    // Admin: Add or Update Book
    bookForm.addEventListener("submit", function(event) {

        event.preventDefault();

        if (!isAdmin) {
            alert("Only Admin can add or update books.");
            return;
        }

        const title = document.getElementById("bookTitle").value.trim();
        const author = document.getElementById("author").value.trim();
        const isbn = document.getElementById("isbn").value.trim();
        const category = document.getElementById("category").value;
        const quantity = Number(
            document.getElementById("quantity").value
        );

        const message = document.getElementById("formMessage");

        if (
            !title || !author || !isbn || !category ||
            !Number.isSafeInteger(quantity) || quantity < 1
        ) {
            message.style.color = "red";
            message.textContent =
                "Please enter valid book details.";
            return;
        }

        // Duplicate ISBN check
        const duplicate = books.find(book =>
            String(book.isbn).toLowerCase() === isbn.toLowerCase() &&
            String(book.id) !== String(editingBookId)
        );

        if (duplicate) {
            message.style.color = "red";
            message.textContent = "This ISBN already exists!";
            return;
        }

        if (editingBookId) {

            const book = books.find(
                b => String(b.id) === String(editingBookId)
            );

            if (!book) return;

            const issuedCopies = book.quantity - book.available;

            if (quantity < issuedCopies) {
                message.style.color = "red";
                message.textContent =
                    "Quantity cannot be less than issued copies.";
                return;
            }

            book.title = title;
            book.author = author;
            book.isbn = isbn;
            book.category = category;
            book.quantity = quantity;
            book.available = quantity - issuedCopies;

            message.style.color = "green";
            message.textContent = "Book updated successfully!";

        } else {

            const newBook = {
                id: String(Date.now()) +
                    Math.random().toString(16).slice(2),
                title,
                author,
                isbn,
                category,
                quantity,
                available: quantity
            };

            books.push(newBook);

            message.style.color = "green";
            message.textContent = "Book added successfully!";
        }

        saveBooks();
        displayBooks();

        bookForm.reset();
        editingBookId = null;

        setTimeout(function() {
            formSection.classList.add("hidden");
        }, 700);
    });
}

// Display Books - Both Admin and Student
function displayBooks() {

    const search = searchInput.value.toLowerCase().trim();
    const selectedCategory = filterCategory.value;

    const filteredBooks = books.filter(book => {

        const matchesSearch =
            String(book.title || "").toLowerCase().includes(search) ||
            String(book.author || "").toLowerCase().includes(search) ||
            String(book.isbn || "").toLowerCase().includes(search);

        const matchesCategory =
            selectedCategory === "all" ||
            book.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    bookTableBody.innerHTML = "";

    filteredBooks.forEach(book => {

        const row = document.createElement("tr");

        // Student sees availability status, not management actions
        if (isAdmin) {

            row.innerHTML = `
                <td>${escapeHTML(book.title)}</td>
                <td>${escapeHTML(book.author)}</td>
                <td>${escapeHTML(book.isbn)}</td>
                <td>${escapeHTML(book.category)}</td>
                <td>${Number(book.quantity) || 0}</td>
                <td>${Number(book.available) || 0}</td>

                <td>
                    <button class="action-btn edit-btn"
                        data-action="edit"
                        data-id="${escapeHTML(book.id)}">
                        Edit
                    </button>

                    <button class="action-btn delete-btn"
                        data-action="delete"
                        data-id="${escapeHTML(book.id)}">
                        Delete
                    </button>
                </td>
            `;

        } else {

            const available = Number(book.available) || 0;

            row.innerHTML = `
                <td>${escapeHTML(book.title)}</td>
                <td>${escapeHTML(book.author)}</td>
                <td>${escapeHTML(book.isbn)}</td>
                <td>${escapeHTML(book.category)}</td>
                <td>${Number(book.quantity) || 0}</td>
                <td>
                    <span style="
                        color:${available > 0 ? "#16a34a" : "#dc2626"};
                        font-weight:600;
                    ">
                        ${available > 0
                            ? available + " Available"
                            : "Currently Unavailable"}
                    </span>
                </td>
            `;
        }

        bookTableBody.appendChild(row);
    });

    // Empty message
    document.getElementById("emptyMessage").style.display =
        filteredBooks.length === 0 ? "block" : "none";

    document.getElementById("bookCount").textContent =
        filteredBooks.length + " books";

    updateStatistics();
}

// Update Statistics
function updateStatistics() {

    const total = books.reduce(
        (sum, book) => sum + (Number(book.quantity) || 0), 0
    );

    const available = books.reduce(
        (sum, book) => sum + (Number(book.available) || 0), 0
    );

    const categories = new Set(
        books.map(book => book.category)
    );

    document.getElementById("totalBooks").textContent = total;

    document.getElementById("availableBooks").textContent =
        available;

    document.getElementById("totalCategories").textContent =
        categories.size;
}

// Admin: Edit and Delete button actions
if (isAdmin) {

    bookTableBody.addEventListener("click", function(event) {

        const button = event.target.closest(
            "button[data-action]"
        );

        if (!button) return;

        const id = button.dataset.id;
        const action = button.dataset.action;

        if (action === "edit") {
            editBook(id);
        } else if (action === "delete") {
            deleteBook(id);
        }
    });
}

// Admin: Edit Book
function editBook(id) {

    if (!isAdmin) {
        alert("Students cannot edit books.");
        return;
    }

    const book = books.find(
        b => String(b.id) === String(id)
    );

    if (!book) return;

    editingBookId = id;

    document.getElementById("bookTitle").value = book.title;
    document.getElementById("author").value = book.author;
    document.getElementById("isbn").value = book.isbn;
    document.getElementById("category").value = book.category;
    document.getElementById("quantity").value = book.quantity;

    document.getElementById("formTitle").textContent =
        "Update Book";

    document.getElementById("formMessage").textContent = "";

    formSection.classList.remove("hidden");

    formSection.scrollIntoView({
        behavior: "smooth"
    });
}

// Admin: Delete Book
function deleteBook(id) {

    if (!isAdmin) {
        alert("Students cannot delete books.");
        return;
    }

    const book = books.find(
        b => String(b.id) === String(id)
    );

    if (!book) return;

    if (book.available !== book.quantity) {
        alert(
            "This book has issued copies. Return them before deleting."
        );
        return;
    }

    const confirmation = confirm(
        "Are you sure you want to delete " + book.title + "?"
    );

    if (confirmation) {

        books = books.filter(
            b => String(b.id) !== String(id)
        );

        saveBooks();
        displayBooks();

        alert("Book deleted successfully!");
    }
}

// Search - Both roles
searchInput.addEventListener("input", displayBooks);

// Category Filter - Both roles
filterCategory.addEventListener("change", displayBooks);

// Initial display
displayBooks();

console.log(
    "LibraFlow Book Management Loaded - Role: " + userRole
);
