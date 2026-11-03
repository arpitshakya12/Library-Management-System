
// ========================================
// LIBRAFLOW - STUDENT MANAGEMENT
// ADMIN ONLY
// ========================================

// Admin access check
if (
    localStorage.getItem("loggedIn") !== "true" ||
    localStorage.getItem("userRole") !== "admin"
) {
    alert("Only Admin can access Student Management.");
    window.location.replace("index.html");
    throw new Error("Admin access required.");
}

// Load students
let students = [];

try {
    students = JSON.parse(
        localStorage.getItem("libraFlowStudents") || "[]"
    );

    if (!Array.isArray(students)) students = [];
} catch {
    students = [];
}

let editingStudentId = null;

// HTML Elements
const studentForm = document.getElementById("studentForm");
const studentName = document.getElementById("studentName");
const studentId = document.getElementById("studentId");
const studentEmail = document.getElementById("studentEmail");
const studentPhone = document.getElementById("studentPhone");
const studentDepartment = document.getElementById("studentDepartment");
const studentYear = document.getElementById("studentYear");
const studentStatus = document.getElementById("studentStatus");

const studentPassword = document.getElementById("studentPassword");
const confirmStudentPassword = document.getElementById("confirmStudentPassword");

const studentTableBody = document.getElementById("studentTableBody");
const searchStudent = document.getElementById("searchStudent");
const departmentFilter = document.getElementById("departmentFilter");

const totalStudents = document.getElementById("totalStudents");
const totalDepartments = document.getElementById("totalDepartments");
const activeStudents = document.getElementById("activeStudents");

const submitBtn = document.getElementById("submitBtn");
const cancelBtn = document.getElementById("cancelBtn");
const formHeading = document.getElementById("formHeading");

// Check required HTML elements
if (
    !studentForm || !studentPassword || !confirmStudentPassword ||
    !studentTableBody
) {
    throw new Error(
        "Student form elements missing. Check students.html IDs."
    );
}

// Save students
function saveStudents() {
    localStorage.setItem(
        "libraFlowStudents",
        JSON.stringify(students)
    );
}

// Escape HTML
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

// Display students
function displayStudents() {
    const searchValue = searchStudent.value.toLowerCase().trim();
    const selectedDepartment = departmentFilter.value;

    const filteredStudents = students.filter(student => {
        const matchesSearch =
            String(student.name || "").toLowerCase().includes(searchValue) ||
            String(student.studentId || "").toLowerCase().includes(searchValue) ||
            String(student.email || "").toLowerCase().includes(searchValue);

        const matchesDepartment =
            selectedDepartment === "" ||
            student.department === selectedDepartment;

        return matchesSearch && matchesDepartment;
    });

    if (filteredStudents.length === 0) {
        studentTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-message">
                    No students found.
                </td>
            </tr>
        `;
    } else {
        studentTableBody.innerHTML = filteredStudents.map(student => `
            <tr>
                <td>${escapeHTML(student.name)}</td>
                <td>${escapeHTML(student.studentId)}</td>
                <td>${escapeHTML(student.email)}</td>
                <td>${escapeHTML(student.phone)}</td>
                <td>${escapeHTML(student.department)}</td>
                <td>${escapeHTML(student.year)}</td>
                <td>
                    <span class="status ${String(student.status).toLowerCase()}">
                        ${escapeHTML(student.status)}
                    </span>
                </td>
                <td>
                    <button class="action-btn edit-btn"
                        data-action="edit"
                        data-id="${escapeHTML(student.id)}">
                        Edit
                    </button>

                    <button class="action-btn"
                        data-action="change-password"
                        data-id="${escapeHTML(student.id)}">
                        Change Password
                    </button>

                    <button class="action-btn delete-btn"
                        data-action="delete"
                        data-id="${escapeHTML(student.id)}">
                        Delete
                    </button>
                </td>
            </tr>
        `).join("");
    }

    updateStatistics();
}

// Statistics
function updateStatistics() {
    totalStudents.textContent = students.length;

    const departments = new Set(
        students.map(student => student.department)
    );

    totalDepartments.textContent = departments.size;

    activeStudents.textContent = students.filter(
        student => student.status === "Active"
    ).length;
}

// Reset form
function resetForm() {
    studentForm.reset();
    editingStudentId = null;

    studentPassword.required = true;
    confirmStudentPassword.required = true;

    studentPassword.disabled = false;
    confirmStudentPassword.disabled = false;

    studentPassword.parentElement.style.display = "block";
    confirmStudentPassword.parentElement.style.display = "block";

    submitBtn.textContent = "Add Student";
    formHeading.textContent = "Add New Student";
    cancelBtn.style.display = "none";
}

// Add or update student
studentForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const name = studentName.value.trim();
    const idValue = studentId.value.trim();
    const email = studentEmail.value.trim().toLowerCase();
    const phone = studentPhone.value.trim();
    const department = studentDepartment.value;
    const year = studentYear.value;
    const status = studentStatus.value;

    const password = studentPassword.value;
    const confirmPassword = confirmStudentPassword.value;

    if (
        !name || !idValue || !email || !phone ||
        !department || !year || !status
    ) {
        alert("Please fill all required fields.");
        return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
        alert("Enter a valid 10-digit phone number.");
        return;
    }

    // Password validation only while adding a student
    if (!editingStudentId) {
        if (!password || !confirmPassword) {
            alert("Please enter and confirm student password.");
            return;
        }

        if (password.length < 8) {
            alert("Password must contain at least 8 characters.");
            return;
        }

        if (password !== confirmPassword) {
            alert("Password and Confirm Password do not match.");
            return;
        }
    }

    // Duplicate ID and email check
    const duplicate = students.find(student =>
        String(student.id) !== String(editingStudentId) &&
        (
            String(student.studentId).toLowerCase() === idValue.toLowerCase() ||
            String(student.email).toLowerCase() === email
        )
    );

    if (duplicate) {
        alert("Student ID or Email already exists!");
        return;
    }

    if (editingStudentId) {
        const student = students.find(
            item => String(item.id) === String(editingStudentId)
        );

        if (!student) {
            alert("Student record not found.");
            resetForm();
            return;
        }

        // Update student details only.
        // Password is changed separately by Admin.
        student.name = name;
        student.studentId = idValue;
        student.email = email;
        student.phone = phone;
        student.department = department;
        student.year = year;
        student.status = status;

        alert("Student details updated successfully!");

    } else {
        const newStudent = {
            id: Date.now().toString(),
            name: name,
            studentId: idValue,
            email: email,
            phone: phone,
            department: department,
            year: year,
            status: status,

            // Password entered manually by Admin
            password: password
        };

        students.push(newStudent);

        alert(
            "STUDENT ACCOUNT CREATED SUCCESSFULLY!\n\n" +
            "Name: " + name + "\n" +
            "Email: " + email + "\n\n" +
            "Give the student the password entered by you."
        );
    }

    saveStudents();
    displayStudents();
    resetForm();
});

// Table actions
studentTableBody.addEventListener("click", function(event) {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;

    if (action === "edit") editStudent(id);
    if (action === "delete") deleteStudent(id);
    if (action === "change-password") changeStudentPassword(id);
});

// Edit student details
function editStudent(id) {
    const student = students.find(
        item => String(item.id) === String(id)
    );

    if (!student) return;

    editingStudentId = id;

    studentName.value = student.name || "";
    studentId.value = student.studentId || "";
    studentEmail.value = student.email || "";
    studentPhone.value = student.phone || "";
    studentDepartment.value = student.department || "";
    studentYear.value = student.year || "";
    studentStatus.value = student.status || "Active";

    // Password is not edited in the details form
    studentPassword.value = "";
    confirmStudentPassword.value = "";

    studentPassword.required = false;
    confirmStudentPassword.required = false;

    studentPassword.parentElement.style.display = "none";
    confirmStudentPassword.parentElement.style.display = "none";

    submitBtn.textContent = "Update Student";
    formHeading.textContent = "Edit Student";
    cancelBtn.style.display = "inline-block";

    window.scrollTo({ top: 0, behavior: "smooth" });
}

// Admin manually changes student password


function changeStudentPassword(id) {
    const student = students.find(
        item => String(item.id) === String(id)
    );

    if (!student) {
        alert("Student not found.");
        return;
    }

    document.getElementById("passwordModal")?.remove();
    document.getElementById("passwordModalStyles")?.remove();

    // Modern popup styles
    const styles = document.createElement("style");
    styles.id = "passwordModalStyles";

    styles.textContent = `
        #passwordModal * {
            box-sizing: border-box;
        }

        #passwordModal {
            position: fixed;
            inset: 0;
            z-index: 99999;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
            background: rgba(15, 23, 42, 0.65);
            backdrop-filter: blur(7px);
            animation: modalFade .25s ease;
        }

        #passwordModal .password-card {
            width: 100%;
            max-width: 440px;
            background: #ffffff;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 25px 70px rgba(0,0,0,.25);
            animation: modalSlide .3s ease;
            font-family: Arial, sans-serif;
        }

        #passwordModal .modal-header {
            padding: 25px;
            color: white;
            background: linear-gradient(135deg,#2563eb,#7c3aed);
            position: relative;
        }

        #passwordModal .modal-icon {
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 14px;
            background: rgba(255,255,255,.2);
            font-size: 23px;
            margin-bottom: 15px;
        }

        #passwordModal .modal-header h2 {
            margin: 0 0 7px;
            font-size: 22px;
        }

        #passwordModal .modal-header p {
            margin: 0;
            font-size: 13px;
            opacity: .9;
        }

        #passwordModal .close-modal {
            position: absolute;
            top: 17px;
            right: 18px;
            border: 0;
            background: rgba(255,255,255,.18);
            color: white;
            width: 34px;
            height: 34px;
            border-radius: 50%;
            font-size: 21px;
            cursor: pointer;
        }

        #passwordModal .modal-body {
            padding: 25px;
        }

        #passwordModal .student-info {
            padding: 13px;
            border-radius: 12px;
            background: #f1f5f9;
            margin-bottom: 23px;
        }

        #passwordModal .student-info strong {
            display: block;
            color: #1e293b;
            font-size: 14px;
            margin-bottom: 5px;
        }

        #passwordModal .student-info span {
            font-size: 12px;
            color: #64748b;
            overflow-wrap: anywhere;
        }

        #passwordModal .field-group {
            margin-bottom: 19px;
        }

        #passwordModal label {
            display: block;
            font-size: 13px;
            font-weight: 600;
            color: #334155;
            margin-bottom: 8px;
        }

        #passwordModal .input-wrap {
            position: relative;
        }

        #passwordModal input {
            width: 100%;
            height: 46px;
            padding: 0 48px 0 13px;
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            font-size: 14px;
            outline: none;
            color: #1e293b;
            background: white;
        }

        #passwordModal input:focus {
            border-color: #6366f1;
            box-shadow: 0 0 0 3px rgba(99,102,241,.12);
        }

        #passwordModal .toggle-password {
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            border: 0;
            background: transparent;
            color: #64748b;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
        }

        #passwordModal .password-hint {
            color: #94a3b8;
            font-size: 11px;
            margin-top: 6px;
        }

        #passwordModal .strength-track {
            height: 5px;
            border-radius: 10px;
            background: #e2e8f0;
            margin-top: 9px;
            overflow: hidden;
        }

        #passwordModal .strength-bar {
            height: 100%;
            width: 0;
            background: #ef4444;
            transition: .2s;
        }

        #passwordModal .strength-label {
            font-size: 11px;
            color: #64748b;
            margin-top: 5px;
        }

        #passwordModal .modal-error {
            color: #dc2626;
            background: #fef2f2;
            border-radius: 8px;
            padding: 10px;
            font-size: 12px;
            margin-bottom: 15px;
            display: none;
        }

        #passwordModal .modal-actions {
            display: flex;
            gap: 11px;
            margin-top: 24px;
        }

        #passwordModal .modal-actions button {
            flex: 1;
            height: 45px;
            border-radius: 10px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: .2s;
        }

        #passwordModal .cancel-password {
            background: white;
            color: #475569;
            border: 1px solid #cbd5e1;
        }

        #passwordModal .save-password {
            background: linear-gradient(135deg,#2563eb,#6366f1);
            color: white;
            border: none;
        }

        #passwordModal .save-password:hover {
            opacity: .9;
            transform: translateY(-1px);
        }

        @keyframes modalFade {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes modalSlide {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }

        @media(max-width:480px) {
            #passwordModal .modal-body,
            #passwordModal .modal-header {
                padding: 20px;
            }
        }
    `;

    document.head.appendChild(styles);

    // Popup HTML
    const modal = document.createElement("div");
    modal.id = "passwordModal";

    modal.innerHTML = `
        <div class="password-card">

            <div class="modal-header">
                <button type="button" class="close-modal"
                    id="closePasswordModal">×</button>

                <div class="modal-icon">🔐</div>

                <h2>Change Password</h2>
                <p>Update the student's account password</p>
            </div>

            <div class="modal-body">

                <div class="student-info">
                    <strong>${escapeHTML(student.name)}</strong>
                    <span>${escapeHTML(student.email)}</span>
                </div>

                <form id="changePasswordForm">

                    <div class="field-group">
                        <label for="newStudentPassword">
                            New Password
                        </label>

                        <div class="input-wrap">
                            <input
                                type="password"
                                id="newStudentPassword"
                                placeholder="Enter new password"
                                minlength="8"
                                required
                            >

                            <button type="button"
                                class="toggle-password"
                                data-target="newStudentPassword">
                                Show
                            </button>
                        </div>

                        <div class="strength-track">
                            <div class="strength-bar"
                                id="passwordStrengthBar"></div>
                        </div>

                        <div class="strength-label"
                            id="passwordStrengthText">
                            Password strength
                        </div>
                    </div>

                    <div class="field-group">
                        <label for="confirmNewStudentPassword">
                            Confirm New Password
                        </label>

                        <div class="input-wrap">
                            <input
                                type="password"
                                id="confirmNewStudentPassword"
                                placeholder="Re-enter new password"
                                minlength="8"
                                required
                            >

                            <button type="button"
                                class="toggle-password"
                                data-target="confirmNewStudentPassword">
                                Show
                            </button>
                        </div>

                        <div class="password-hint">
                            Minimum 8 characters required.
                        </div>
                    </div>

                    <div class="modal-error" id="passwordModalError"></div>

                    <div class="modal-actions">
                        <button type="button"
                            class="cancel-password"
                            id="cancelPasswordModal">
                            Cancel
                        </button>

                        <button type="submit"
                            class="save-password">
                            Save Password
                        </button>
                    </div>

                </form>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const newPasswordInput =
        document.getElementById("newStudentPassword");

    const confirmPasswordInput =
        document.getElementById("confirmNewStudentPassword");

    const errorBox =
        document.getElementById("passwordModalError");

    const strengthBar =
        document.getElementById("passwordStrengthBar");

    const strengthText =
        document.getElementById("passwordStrengthText");

    // Close popup
    function closeModal() {
        modal.remove();
        styles.remove();
    }

    document.getElementById("closePasswordModal")
        .addEventListener("click", closeModal);

    document.getElementById("cancelPasswordModal")
        .addEventListener("click", closeModal);

    modal.addEventListener("click", function(event) {
        if (event.target === modal) closeModal();
    });

    // Show / Hide password
    modal.querySelectorAll(".toggle-password")
        .forEach(button => {
            button.addEventListener("click", function() {
                const input = document.getElementById(
                    button.dataset.target
                );

                const visible = input.type === "text";
                input.type = visible ? "password" : "text";
                button.textContent = visible ? "Show" : "Hide";
            });
        });

    // Password strength indicator
    newPasswordInput.addEventListener("input", function() {
        const value = newPasswordInput.value;
        let score = 0;

        if (value.length >= 8) score++;
        if (/[A-Z]/.test(value)) score++;
        if (/[a-z]/.test(value)) score++;
        if (/[0-9]/.test(value)) score++;
        if (/[^A-Za-z0-9]/.test(value)) score++;

        const labels = [
            "Password strength",
            "Weak",
            "Fair",
            "Good",
            "Strong",
            "Very strong"
        ];

        strengthBar.style.width = (score * 20) + "%";
        strengthText.textContent = labels[score];

        const colors = [
            "#e2e8f0",
            "#ef4444",
            "#f97316",
            "#eab308",
            "#22c55e",
            "#16a34a"
        ];

        strengthBar.style.background = colors[score];
    });

    // Save new password
    document.getElementById("changePasswordForm")
        .addEventListener("submit", function(event) {
            event.preventDefault();

            const newPassword = newPasswordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            errorBox.style.display = "none";

            if (newPassword.length < 8) {
                errorBox.textContent =
                    "Password must contain at least 8 characters.";
                errorBox.style.display = "block";
                return;
            }

            if (newPassword !== confirmPassword) {
                errorBox.textContent =
                    "Passwords do not match. Please try again.";
                errorBox.style.display = "block";
                return;
            }

            student.password = newPassword;

            saveStudents();

            closeModal();

            alert("Student password updated successfully!");
        });
}



// Delete student
function deleteStudent(id) {
    const student = students.find(
        item => String(item.id) === String(id)
    );

    if (!student) return;

    let transactions = [];

    try {
        transactions = JSON.parse(
            localStorage.getItem("libraFlowTransactions") || "[]"
        );
    } catch {
        transactions = [];
    }

    const hasActiveBooks = transactions.some(transaction =>
        String(transaction.studentId) === String(id) &&
        transaction.status === "Issued"
    );

    if (hasActiveBooks) {
        alert(
            "This student has books that have not been returned. " +
            "Return them before deleting the student."
        );
        return;
    }

    if (!confirm("Are you sure you want to delete this student?")) {
        return;
    }

    students = students.filter(
        item => String(item.id) !== String(id)
    );

    saveStudents();
    displayStudents();

    if (String(editingStudentId) === String(id)) {
        resetForm();
    }

    alert("Student deleted successfully!");
}

// Search and filters
searchStudent.addEventListener("input", displayStudents);
departmentFilter.addEventListener("change", displayStudents);
cancelBtn.addEventListener("click", resetForm);

// Initial setup
cancelBtn.style.display = "none";
displayStudents();
