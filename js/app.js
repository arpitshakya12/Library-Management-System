
console.log("LibraFlow Dashboard Started!");

function getSavedData(key) {
    try {
        const data = JSON.parse(localStorage.getItem(key) || "[]");
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Storage error:", key, error);
        return [];
    }
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

const userRole = localStorage.getItem("userRole");
const userEmail = (localStorage.getItem("userEmail") || "").toLowerCase();

const profileName = document.getElementById("profileName");
const profileRole = document.getElementById("profileRole");
const profileAvatar = document.getElementById("profileAvatar");

profileName.textContent = userEmail || "User";
profileRole.textContent = userRole === "admin" ? "Administrator" : "Student";
profileAvatar.textContent = userRole === "admin" ? "A" : "S";

// Show correct dashboard according to role
const adminDashboard = document.getElementById("adminDashboard");
const studentDashboard = document.getElementById("studentDashboard");

if (userRole === "admin") {
    adminDashboard.style.display = "block";
    studentDashboard.style.display = "none";
    document.getElementById("dashboardTitle").textContent = "Admin Dashboard";
    document.getElementById("welcomeMessage").textContent =
        "Welcome Admin! Manage your library here.";
} else {
    adminDashboard.style.display = "none";
    studentDashboard.style.display = "block";
    document.getElementById("dashboardTitle").textContent = "Student Dashboard";
    document.getElementById("welcomeMessage").textContent =
        "Welcome! Here is your personal library overview.";

    document.querySelectorAll(".admin-only").forEach(link => {
        link.style.display = "none";
    });
}

// Theme toggle
const themeBtn = document.getElementById("themeBtn");

themeBtn.addEventListener("click", function () {
    document.body.classList.toggle("dark");
    themeBtn.textContent =
        document.body.classList.contains("dark") ? "☀️" : "🌙";
});

// Calculate current fine at ₹5 per late day
function calculateFine(transaction) {
    const due = new Date(transaction.dueDate + "T00:00:00");
    if (Number.isNaN(due.getTime())) return Number(transaction.fine || 0);

    const endDate = transaction.status === "Returned" && transaction.returnDate
        ? new Date(transaction.returnDate + "T00:00:00")
        : new Date();

    const lateDays = Math.max(
        0,
        Math.floor((endDate - due) / (1000 * 60 * 60 * 24))
    );

    return lateDays * 5;
}

// ADMIN DASHBOARD
function updateAdminDashboard() {
    const books = getSavedData("libraFlowBooks");
    const students = getSavedData("libraFlowStudents");
    const transactions = getSavedData("libraFlowTransactions");

    const totalCopies = books.reduce(
        (sum, book) => sum + Number(book.quantity || 0), 0
    );

    const availableCopies = books.reduce(
        (sum, book) => sum + Number(book.available || 0), 0
    );

    const issuedCount = transactions.filter(
        transaction => transaction.status === "Issued"
    ).length;

    document.getElementById("totalBooks").textContent = totalCopies;
    document.getElementById("totalStudents").textContent = students.length;
    document.getElementById("issuedBooks").textContent = issuedCount;
    document.getElementById("availableBooks").textContent = availableCopies;

    const recent = [...transactions]
        .sort((a, b) => Number(b.id) - Number(a.id))
        .slice(0, 5);

    const tableBody = document.getElementById("recentTransactions");

    if (!recent.length) {
        tableBody.innerHTML =
            '<tr><td colspan="4">No transactions available yet.</td></tr>';
        return;
    }

    tableBody.innerHTML = recent.map(transaction => {
        const student = students.find(
            item => String(item.id) === String(transaction.studentId)
        );
        const book = books.find(
            item => String(item.id) === String(transaction.bookId)
        );

        const studentName = student?.name || transaction.studentName || "Unknown";
        const bookTitle = book?.title || transaction.bookTitle || "Unknown";
        const statusClass =
            transaction.status === "Issued" ? "issued" : "returned";

        return `
            <tr>
                <td>${escapeHTML(studentName)}</td>
                <td>${escapeHTML(bookTitle)}</td>
                <td>${escapeHTML(transaction.issueDate)}</td>
                <td><span class="badge ${statusClass}">
                    ${escapeHTML(transaction.status)}
                </span></td>
            </tr>
        `;
    }).join("");
}

// STUDENT DASHBOARD
function updateStudentDashboard() {
    const books = getSavedData("libraFlowBooks");
    const students = getSavedData("libraFlowStudents");
    const allTransactions = getSavedData("libraFlowTransactions");

    // Match the logged-in email with the registered student
    const currentStudent = students.find(
        student => String(student.email || "").toLowerCase() === userEmail
    );

    const bookList = document.getElementById("studentBookList");
    const transactionList = document.getElementById("myTransactions");

    if (!currentStudent) {
        document.getElementById("studentAvailableBooks").textContent =
            books.reduce((sum, book) => sum + Number(book.available || 0), 0);

        document.getElementById("myIssuedBooks").textContent = "0";
        document.getElementById("myOverdueBooks").textContent = "0";
        document.getElementById("myTotalFine").textContent = "₹0";

        transactionList.innerHTML =
            '<tr><td colspan="5">Your student account is not linked. Contact the library administrator.</td></tr>';

    } else {
        // Only this student's transactions are displayed
        const myTransactions = allTransactions.filter(
            transaction =>
                String(transaction.studentId) === String(currentStudent.id)
        );

        const activeTransactions = myTransactions.filter(
            transaction => transaction.status === "Issued"
        );

        const overdueTransactions = activeTransactions.filter(transaction => {
            if (!transaction.dueDate) return false;
            return new Date(transaction.dueDate + "T00:00:00") < new Date(
                new Date().toDateString()
            );
        });

        const totalFine = myTransactions.reduce(
            (sum, transaction) => sum + calculateFine(transaction), 0
        );

        document.getElementById("myIssuedBooks").textContent =
            activeTransactions.length;

        document.getElementById("myOverdueBooks").textContent =
            overdueTransactions.length;

        document.getElementById("myTotalFine").textContent =
            "₹" + totalFine;

        if (!myTransactions.length) {
            transactionList.innerHTML =
                '<tr><td colspan="5">You have no book transactions yet.</td></tr>';
        } else {
            transactionList.innerHTML = myTransactions.map(transaction => {
                const book = books.find(
                    item => String(item.id) === String(transaction.bookId)
                );

                const title = book?.title || transaction.bookTitle || "Unknown Book";
                const fine = calculateFine(transaction);
                const statusClass =
                    transaction.status === "Issued" ? "issued" : "returned";

                return `
                    <tr>
                        <td>${escapeHTML(title)}</td>
                        <td>${escapeHTML(transaction.issueDate)}</td>
                        <td>${escapeHTML(transaction.dueDate || "-")}</td>
                        <td><span class="badge ${statusClass}">
                            ${escapeHTML(transaction.status)}
                        </span></td>
                        <td>₹${fine}</td>
                    </tr>
                `;
            }).join("");
        }
    }

    const availableCopies = books.reduce(
        (sum, book) => sum + Number(book.available || 0), 0
    );

    document.getElementById("studentAvailableBooks").textContent =
        availableCopies;

    const availableBooks = books.filter(
        book => Number(book.available || 0) > 0
    );

    if (!availableBooks.length) {
        bookList.innerHTML =
            '<tr><td colspan="4">No books currently available.</td></tr>';
    } else {
        bookList.innerHTML = availableBooks.map(book => `
            <tr>
                <td>${escapeHTML(book.title)}</td>
                <td>${escapeHTML(book.author)}</td>
                <td>${escapeHTML(book.category)}</td>
                <td>${Number(book.available || 0)}</td>
            </tr>
        `).join("");
    }
}

// Logout
document.getElementById("logoutBtn").addEventListener("click", function () {
    if (confirm("Are you sure you want to logout?")) {
        localStorage.removeItem("loggedIn");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userEmail");
        window.location.replace("login.html");
    }
});

// Load dashboard
if (userRole === "admin") {
    updateAdminDashboard();
} else if (userRole === "student") {
    updateStudentDashboard();
}
