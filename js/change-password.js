
// ========================================
// LIBRAFLOW - FIRST LOGIN PASSWORD CHANGE
// ========================================

if (
    localStorage.getItem("loggedIn") !== "true" ||
    localStorage.getItem("userRole") !== "student"
) {
    window.location.replace("login.html");
}

const changePasswordForm =
    document.getElementById("changePasswordForm");

const newPasswordInput =
    document.getElementById("newPassword");

const confirmPasswordInput =
    document.getElementById("confirmPassword");

const passwordMessage =
    document.getElementById("passwordMessage");

changePasswordForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (newPassword.length < 8) {
        passwordMessage.style.color = "red";
        passwordMessage.textContent =
            "Password must contain at least 8 characters.";
        return;
    }

    if (newPassword !== confirmPassword) {
        passwordMessage.style.color = "red";
        passwordMessage.textContent =
            "Passwords do not match.";
        return;
    }

    const email = (
        localStorage.getItem("userEmail") || ""
    ).toLowerCase();

    const students = JSON.parse(
        localStorage.getItem("libraFlowStudents") || "[]"
    );

    const studentIndex = students.findIndex(student =>
        String(student.email || "").toLowerCase() === email
    );

    if (studentIndex === -1) {
        passwordMessage.style.color = "red";
        passwordMessage.textContent =
            "Student account not found. Contact Admin.";
        return;
    }

    const student = students[studentIndex];

    if (student.status !== "Active") {
        passwordMessage.style.color = "red";
        passwordMessage.textContent =
            "Your account is inactive. Contact Admin.";
        return;
    }

    if (student.mustChangePassword !== true) {
        window.location.replace("index.html");
        return;
    }

    student.password = newPassword;
    student.mustChangePassword = false;

    localStorage.setItem(
        "libraFlowStudents",
        JSON.stringify(students)
    );

    passwordMessage.style.color = "green";
    passwordMessage.textContent =
        "Password changed successfully!";

    setTimeout(() => {
        window.location.href = "index.html";
    }, 800);
});
