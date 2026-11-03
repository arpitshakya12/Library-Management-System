// ========================================
// LIBRAFLOW - FIRST-RUN DEMO DATA
// Seeds sample records once; never overwrites
// data after the first initialization.
// ========================================
(function () {
    const SEED_KEY = "libraFlowDemoDataInitialized";

    const today = new Date();
    const formatDate = date => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    };
    const shiftDate = days => {
        const date = new Date(today);
        date.setDate(date.getDate() + days);
        return formatDate(date);
    };

    const demoBooks = [
        { id: "DEMO-B001", title: "Python Crash Course", author: "Eric Matthes", isbn: "9781593279288", category: "Programming", quantity: 10, available: 9 },
        { id: "DEMO-B002", title: "Clean Code", author: "Robert C. Martin", isbn: "9780132350884", category: "Programming", quantity: 8, available: 7 },
        { id: "DEMO-B003", title: "Operating System Concepts", author: "Abraham Silberschatz", isbn: "9781119800361", category: "Computer Science", quantity: 7, available: 7 },
        { id: "DEMO-B004", title: "Database System Concepts", author: "Abraham Silberschatz", isbn: "9780078022159", category: "Database", quantity: 6, available: 6 },
        { id: "DEMO-B005", title: "Computer Networks", author: "Andrew S. Tanenbaum", isbn: "9780132126953", category: "Networking", quantity: 5, available: 5 },
        { id: "DEMO-B006", title: "Artificial Intelligence: A Modern Approach", author: "Stuart Russell", isbn: "9780134610993", category: "Artificial Intelligence", quantity: 4, available: 4 },
        { id: "DEMO-B007", title: "Let Us C", author: "Yashavant Kanetkar", isbn: "9789389845671", category: "Programming", quantity: 10, available: 10 }
    ];

    const demoStudents = [
        { id: "DEMO-S001", name: "Rahul Sharma", studentId: "STU001", email: "rahul.demo@libraflow.com", phone: "9876500001", department: "Computer Science", year: "1st Year", status: "Active", password: "Rahul@123" },
        { id: "DEMO-S002", name: "Priya Verma", studentId: "STU002", email: "priya.demo@libraflow.com", phone: "9876500002", department: "Computer Science", year: "1st Year", status: "Active", password: "Priya@123" },
        { id: "DEMO-S003", name: "Aman Kumar", studentId: "STU003", email: "aman.demo@libraflow.com", phone: "9876500003", department: "Computer Science", year: "2nd Year", status: "Active", password: "Aman@123" },
        { id: "DEMO-S004", name: "Sneha Singh", studentId: "STU004", email: "sneha.demo@libraflow.com", phone: "9876500004", department: "Information Technology", year: "1st Year", status: "Active", password: "Sneha@123" },
        { id: "DEMO-S005", name: "Rohan Gupta", studentId: "STU005", email: "rohan.demo@libraflow.com", phone: "9876500005", department: "Computer Science", year: "2nd Year", status: "Active", password: "Rohan@123" },
        { id: "DEMO-S006", name: "Neha Patel", studentId: "STU006", email: "neha.demo@libraflow.com", phone: "9876500006", department: "Computer Science", year: "1st Year", status: "Active", password: "Neha@123" },
        { id: "DEMO-S007", name: "Karan Mehta", studentId: "STU007", email: "karan.demo@libraflow.com", phone: "9876500007", department: "Information Technology", year: "2nd Year", status: "Active", password: "Karan@123" },
        { id: "DEMO-S008", name: "Anjali Gupta", studentId: "STU008", email: "anjali.demo@libraflow.com", phone: "9876500008", department: "Computer Science", year: "1st Year", status: "Active", password: "Anjali@123" },
        { id: "DEMO-S009", name: "Vikram Singh", studentId: "STU009", email: "vikram.demo@libraflow.com", phone: "9876500009", department: "Electronics", year: "2nd Year", status: "Active", password: "Vikram@123" },
        { id: "DEMO-S010", name: "Pooja Sharma", studentId: "STU010", email: "pooja.demo@libraflow.com", phone: "9876500010", department: "Computer Science", year: "1st Year", status: "Active", password: "Pooja@123" }
    ];

    const demoTransactions = [
        { id: 1001, studentId: "DEMO-S001", studentName: "Rahul Sharma", bookId: "DEMO-B001", bookTitle: "Python Crash Course", issueDate: shiftDate(-2), dueDate: shiftDate(12), returnDate: null, fine: 0, status: "Issued" },
        { id: 1002, studentId: "DEMO-S002", studentName: "Priya Verma", bookId: "DEMO-B002", bookTitle: "Clean Code", issueDate: shiftDate(-1), dueDate: shiftDate(13), returnDate: null, fine: 0, status: "Issued" },
        { id: 1003, studentId: "DEMO-S003", studentName: "Aman Kumar", bookId: "DEMO-B003", bookTitle: "Operating System Concepts", issueDate: shiftDate(-20), dueDate: shiftDate(-10), returnDate: shiftDate(-9), fine: 5, status: "Returned" }
    ];

    const seedIfEmpty = (key, records) => {
        try {
            const existing = JSON.parse(localStorage.getItem(key) || "[]");
            if (!Array.isArray(existing) || existing.length === 0) {
                localStorage.setItem(key, JSON.stringify(records));
            }
        } catch {
            localStorage.setItem(key, JSON.stringify(records));
        }
    };

    seedIfEmpty("libraFlowBooks", demoBooks);

    // Add any missing demo students even when an older version has already
    // initialized demo data. Preserve existing/custom student records.
    try {
        const currentStudents = JSON.parse(localStorage.getItem("libraFlowStudents") || "[]");
        const students = Array.isArray(currentStudents) ? currentStudents : [];
        const knownKeys = new Set(students.flatMap(student => [student.studentId, student.email].filter(Boolean).map(value => String(value).toLowerCase())));
        demoStudents.forEach(student => {
            const idKey = String(student.studentId).toLowerCase();
            const emailKey = String(student.email).toLowerCase();
            if (!knownKeys.has(idKey) && !knownKeys.has(emailKey)) {
                students.push(student);
                knownKeys.add(idKey);
                knownKeys.add(emailKey);
            }
        });
        localStorage.setItem("libraFlowStudents", JSON.stringify(students));
    } catch (error) {
        console.error("Unable to add LibraFlow demo students:", error);
    }

    seedIfEmpty("libraFlowTransactions", demoTransactions);
    localStorage.setItem(SEED_KEY, "true");
})();
