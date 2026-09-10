const STORAGE_KEY = "electronic-journal-v1";

let data = {
    students: [],
    journals: {}
};

let editingStudentId = null;


// -------------------------
// ЗАВАНТАЖЕННЯ
// -------------------------

function loadData() {

    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
        try {
            data = JSON.parse(saved);
        } catch {
            data = {
                students: [],
                journals: {}
            };
        }
    }

    if (!data.students) data.students = [];
    if (!data.journals) data.journals = [];
}


// -------------------------
// ЗБЕРЕЖЕННЯ
// -------------------------

function saveData() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
    );
}


// -------------------------
// СТОРІНКИ
// -------------------------

function showPage(page) {

    document.querySelectorAll(".page")
        .forEach(x => x.classList.remove("active"));

    document.querySelectorAll(".bottom-nav button")
        .forEach(x => x.classList.remove("active"));

    document.getElementById(page).classList.add("active");

    document.getElementById("nav-" + page)
        .classList.add("active");

    if (page === "journal") {
        renderJournal();
    }

    if (page === "students") {
        renderStudents();
    }

    if (page === "history") {
        renderHistory();
    }
}


// -------------------------
// ДАТА
// -------------------------

function today() {

    const d = new Date();

    const year = d.getFullYear();

    const month = String(
        d.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        d.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


// -------------------------
// ЖУРНАЛ
// -------------------------

function renderJournal() {

    const dateInput =
        document.getElementById("journalDate");

    if (!dateInput.value) {
        dateInput.value = today();
    }

    const date = dateInput.value;

    const list =
        document.getElementById("journalList");

    if (data.students.length === 0) {

        list.innerHTML = `
            <div class="empty">
                Спочатку додайте студентів
                у розділі 👨‍🎓 Студенти.
            </div>
        `;

        return;
    }

    if (!data.journals[date]) {
        data.journals[date] = {};
    }

    list.innerHTML = data.students.map(student => {

        const status =
            data.journals[date][student.id] || "";

        return `
            <div class="student-card">

                <div class="student-name">
                    ${escapeHtml(student.name)}
                </div>

                <div class="status-buttons">

                    <button
                        class="status-btn ${status === "present" ? "active" : ""}"
                        onclick="setStatus('${student.id}', 'present')"
                    >
                        ✅
                        <small>Присутній</small>
                    </button>

                    <button
                        class="status-btn ${status === "absent" ? "active" : ""}"
                        onclick="setStatus('${student.id}', 'absent')"
                    >
                        ❌
                        <small>Відсутній</small>
                    </button>

                    <button
                        class="status-btn ${status === "sick" ? "active" : ""}"
                        onclick="setStatus('${student.id}', 'sick')"
                    >
                        хв
                        <small>Хворіє</small>
                    </button>

                    <button
                        class="status-btn ${status === "reason" ? "active" : ""}"
                        onclick="setStatus('${student.id}', 'reason')"
                    >
                        п/п
                        <small>Поважна причина</small>
                    </button>

                </div>

            </div>
        `;

    }).join("");
}


// -------------------------
// СТАТУС
// -------------------------

function setStatus(studentId, status) {

    const date =
        document.getElementById("journalDate").value;

    if (!data.journals[date]) {
        data.journals[date] = {};
    }

    data.journals[date][studentId] = status;

    saveData();

    renderJournal();
}


// -------------------------
// СТУДЕНТИ
// -------------------------

function renderStudents() {

    const list =
        document.getElementById("studentsList");

    if (data.students.length === 0) {

        list.innerHTML = `
            <div class="empty">
                Студентів поки немає.
            </div>
        `;

        return;
    }

    list.innerHTML = data.students.map(student => {

        return `
            <div class="student-row">

                <strong>
                    ${escapeHtml(student.name)}
                </strong>

                <div class="student-actions">

                    <button
                        class="edit"
                        onclick="editStudent('${student.id}')"
                    >
                        ✏️
                    </button>

                    <button
                        class="delete"
                        onclick="deleteStudent('${student.id}')"
                    >
                        🗑️
                    </button>

                </div>

            </div>
        `;

    }).join("");
}


// -------------------------
// ДОДАТИ СТУДЕНТА
// -------------------------

function openStudentForm() {

    editingStudentId = null;

    document.getElementById("modalTitle")
        .textContent = "Додати студента";

    document.getElementById("studentName")
        .value = "";

    document.getElementById("studentModal")
        .classList.add("show");

    setTimeout(() => {
        document.getElementById("studentName").focus();
    }, 100);
}


function closeStudentForm() {

    document.getElementById("studentModal")
        .classList.remove("show");
}


// -------------------------
// ЗБЕРЕГТИ СТУДЕНТА
// -------------------------

function saveStudent() {

    const input =
        document.getElementById("studentName");

    const name =
        input.value.trim();

    if (!name) {
        alert("Введіть ім'я та прізвище");
        return;
    }

    if (editingStudentId) {

        const student =
            data.students.find(
                x => x.id === editingStudentId
            );

        if (student) {
            student.name = name;
        }

    } else {

        data.students.push({
            id: crypto.randomUUID(),
            name: name
        });

    }

    saveData();

    closeStudentForm();

    renderStudents();

    renderJournal();
}


// -------------------------
// РЕДАГУВАТИ
// -------------------------

function editStudent(id) {

    const student =
        data.students.find(x => x.id === id);

    if (!student) return;

    editingStudentId = id;

    document.getElementById("modalTitle")
        .textContent = "Редагувати студента";

    document.getElementById("studentName")
        .value = student.name;

    document.getElementById("studentModal")
        .classList.add("show");
}


// -------------------------
// ВИДАЛИТИ
// -------------------------

function deleteStudent(id) {

    const student =
        data.students.find(x => x.id === id);

    if (!student) return;

    const ok = confirm(
        `Видалити студента "${student.name}"?`
    );

    if (!ok) return;

    data.students =
        data.students.filter(x => x.id !== id);

    saveData();

    renderStudents();

    renderJournal();
}


// -------------------------
// ІСТОРІЯ
// -------------------------

function renderHistory() {

    const list =
        document.getElementById("historyList");

    const dates =
        Object.keys(data.journals || {})
            .sort()
            .reverse();

    if (dates.length === 0) {

        list.innerHTML = `
            <div class="empty">
                Журналів ще немає.
            </div>
        `;

        return;
    }

    list.innerHTML = dates.map(date => {

        const journal =
            data.journals[date] || {};

        let present = 0;
        let absent = 0;
        let sick = 0;
        let reason = 0;

        Object.values(journal).forEach(status => {

            if (status === "present") present++;
            if (status === "absent") absent++;
            if (status === "sick") sick++;
            if (status === "reason") reason++;

        });

        return `
            <div
                class="history-item"
                onclick="openHistory('${date}')"
            >

                <strong>
                    ${formatDate(date)}
                </strong>

                <div class="history-summary">

                    ✅ ${present}
                    &nbsp;&nbsp;
                    ❌ ${absent}
                    &nbsp;&nbsp;
                    хв ${sick}
                    &nbsp;&nbsp;
                    п/п ${reason}

                </div>

            </div>
        `;

    }).join("");
}


function openHistory(date) {

    document.getElementById("journalDate")
        .value = date;

    showPage("journal");
}


// -------------------------
// ФОРМАТУВАННЯ ДАТИ
// -------------------------

function formatDate(date) {

    const parts = date.split("-");

    return `${parts[2]}.${parts[1]}.${parts[0]}`;
}


// -------------------------
// БЕЗПЕЧНИЙ HTML
// -------------------------

function escapeHtml(text) {

    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// -------------------------
// ЗАПУСК
// -------------------------

document
    .getElementById("journalDate")
    .addEventListener("change", renderJournal);

loadData();

document.getElementById("journalDate").value = today();

showPage("journal");


// -------------------------
// PWA
// -------------------------

if ("serviceWorker" in navigator) {

    window.addEventListener("load", () => {

        navigator.serviceWorker
            .register("/sw.js")
            .catch(err => {
                console.log(
                    "Service Worker error:",
                    err
                );
            });

    });

}
