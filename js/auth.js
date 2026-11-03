
// ========================================
// LIBRAFLOW - LOGIN SYSTEM
// ADMIN + STUDENT LOGIN
// ========================================

const loginForm = document.getElementById("loginForm");
const roleInput = document.getElementById("role");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const message = document.getElementById("message");

// Show login message
function showMessage(text, type = "error") {
    message.textContent = text;
    message.style.color = type === "success" ? "green" : "red";
}

// Login form
loginForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const role = roleInput.value;
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    if (!role || !email || !password) {
        showMessage("Please fill all fields.");
        return;
    }

    // ADMIN LOGIN
    if (role === "admin") {

        const adminEmail = "admin@libraflow.com";
        const adminPassword = "admin123";

        if (
            email === adminEmail &&
            password === adminPassword
        ) {
            localStorage.setItem("loggedIn", "true");
            localStorage.setItem("userRole", "admin");
            localStorage.setItem("userEmail", email);

            showMessage("Admin login successful!", "success");

            window.location.href = "index.html";
            return;
        }

        showMessage("Invalid Admin email or password.");
        return;
    }

    // STUDENT LOGIN
    if (role === "student") {

        let students = [];

        try {
            students = JSON.parse(
                localStorage.getItem("libraFlowStudents") || "[]"
            );
        } catch {
            showMessage("Unable to load student accounts.");
            return;
        }

        const student = students.find(item =>
            String(item.email || "").toLowerCase() === email
        );

        if (!student) {
            showMessage("Student account not found. Contact Admin.");
            return;
        }

        if (student.status !== "Active") {
            showMessage("Your account is inactive. Contact Admin.");
            return;
        }

        if (student.password !== password) {
            showMessage("Incorrect password. Please try again.");
            return;
        }

        localStorage.setItem("loggedIn", "true");
        localStorage.setItem("userRole", "student");
        localStorage.setItem("userEmail", email);

        showMessage("Student login successful!", "success");

        // No forced password change
        window.location.href = "index.html";
        return;
    }

    showMessage("Please select a valid role.");
});
