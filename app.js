const STORAGE_KEY = "electronic-journal-v1";

let data = {
    students: [],
    journals: {}
};

let editingStudentId = null;


// ========================================
// ЗАВАНТАЖЕННЯ ДАНИХ
// ========================================

function loadData() {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
        data = {
            students: [],
            journals: {}
        };
        return;
    }

    try {
        const parsed = JSON.parse(saved);

        data = {
            students: Array.isArray(parsed.students)
                ? parsed.students
                : [],

            journals:
                parsed.journals &&
                typeof parsed.journals === "object" &&
                !Array.isArray(parsed.journals)
                    ? parsed.journals
                    : {}
        };

    } catch (error) {
        console.error("Помилка завантаження даних:", error);

        data = {
            students: [],
            journals: {}
        };
    }
}


// ========================================
// ЗБЕРЕЖЕННЯ ДАНИХ
// ========================================

function saveData() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(data)
        );
    } catch (error) {
        console.error("Помилка збереження:", error);

        alert(
            "Не вдалося зберегти дані. " +
            "Можливо, у браузері недостатньо місця."
        );
    }
}


// ========================================
// ПОКАЗ СТОРІНОК
// ========================================

function showPage(page) {

    document.querySelectorAll(".page")
        .forEach(element => {
            element.classList.remove("active");
        });

    document.querySelectorAll(".bottom-nav button")
        .forEach(element => {
            element.classList.remove("active");
        });

    const pageElement =
        document.getElementById(page);

    const navElement =
        document.getElementById("nav-" + page);

    if (pageElement) {
        pageElement.classList.add("active");
    }

    if (navElement) {
        navElement.classList.add("active");
    }


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


// ========================================
// СЬОГОДНІШНЯ ДАТА
// ========================================

function today() {

    const date = new Date();

    const year =
        date.getFullYear();

    const month =
        String(date.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(date.getDate())
            .padStart(2, "0");

    return `${year}-${month}-${day}`;
}


// ========================================
// ЖУРНАЛ
// ========================================

function renderJournal() {

    const dateInput =
        document.getElementById("journalDate");

    const list =
        document.getElementById("journalList");


    if (!dateInput || !list) {
        return;
    }


    // Якщо дата не вибрана
    if (!dateInput.value) {
        dateInput.value = today();
    }


    const date =
        dateInput.value;


    // Якщо студентів немає
    if (data.students.length === 0) {

        list.innerHTML = `
            <div class="empty">
                Спочатку додайте студентів
                у розділі 👨‍🎓 Студенти.
            </div>
        `;

        return;
    }


    // Створюємо журнал для дати,
    // якщо його ще немає
    if (!data.journals[date]) {
        data.journals[date] = {};
        saveData();
    }


    const journal =
        data.journals[date];


    list.innerHTML =
        data.students.map(student => {

            const status =
                journal[student.id] || "";


            return `
                <div class="student-card">

                    <div class="student-name">
                        ${escapeHtml(student.name)}
                    </div>


                    <div class="status-buttons">

                        <button
                            class="status-btn ${
                                status === "present"
                                    ? "active"
                                    : ""
                            }"
                            onclick="setStatus(
                                '${student.id}',
                                'present'
                            )"
                        >
                            ✅
                            <small>
                                Присутній
                            </small>
                        </button>


                        <button
                            class="status-btn ${
                                status === "absent"
                                    ? "active"
                                    : ""
                            }"
                            onclick="setStatus(
                                '${student.id}',
                                'absent'
                            )"
                        >
                            ❌
                            <small>
                                Відсутній
                            </small>
                        </button>


                        <button
                            class="status-btn ${
                                status === "sick"
                                    ? "active"
                                    : ""
                            }"
                            onclick="setStatus(
                                '${student.id}',
                                'sick'
                            )"
                        >
                            хв
                            <small>
                                Хворіє
                            </small>
                        </button>


                        <button
                            class="status-btn ${
                                status === "reason"
                                    ? "active"
                                    : ""
                            }"
                            onclick="setStatus(
                                '${student.id}',
                                'reason'
                            )"
                        >
                            п/п
                            <small>
                                Поважна причина
                            </small>
                        </button>

                    </div>

                </div>
            `;

        }).join("");
}


// ========================================
// ВСТАНОВЛЕННЯ ВІДМІТКИ
// ========================================

function setStatus(studentId, status) {

    const dateInput =
        document.getElementById("journalDate");


    if (!dateInput) {
        return;
    }


    const date =
        dateInput.value;


    if (!date) {
        alert("Спочатку виберіть дату.");
        return;
    }


    // Створюємо журнал цієї дати
    if (!data.journals[date]) {
        data.journals[date] = {};
    }


    // Якщо натиснули на вже активну кнопку —
    // відмітку знімаємо
    if (
        data.journals[date][studentId] === status
    ) {

        delete data.journals[date][studentId];

    } else {

        data.journals[date][studentId] = status;

    }


    saveData();

    renderJournal();

    // Якщо історія вже була відкрита,
    // вона теж буде оновлена наступного разу
}


// ========================================
// СТУДЕНТИ
// ========================================

function renderStudents() {

    const list =
        document.getElementById("studentsList");


    if (!list) {
        return;
    }


    if (data.students.length === 0) {

        list.innerHTML = `
            <div class="empty">
                Студентів поки немає.
            </div>
        `;

        return;
    }


    list.innerHTML =
        data.students.map(student => {

            return `
                <div class="student-row">

                    <strong>
                        ${escapeHtml(student.name)}
                    </strong>


                    <div class="student-actions">

                        <button
                            class="edit"
                            onclick="editStudent(
                                '${student.id}'
                            )"
                        >
                            ✏️
                        </button>


                        <button
                            class="delete"
                            onclick="deleteStudent(
                                '${student.id}'
                            )"
                        >
                            🗑️
                        </button>

                    </div>

                </div>
            `;

        }).join("");
}


// ========================================
// ВІДКРИТИ ФОРМУ ДОДАВАННЯ
// ========================================

function openStudentForm() {

    editingStudentId = null;


    const title =
        document.getElementById("modalTitle");

    const input =
        document.getElementById("studentName");

    const modal =
        document.getElementById("studentModal");


    if (title) {
        title.textContent = "Додати студента";
    }


    if (input) {
        input.value = "";
    }


    if (modal) {
        modal.classList.add("show");
    }


    setTimeout(() => {

        if (input) {
            input.focus();
        }

    }, 100);
}


// ========================================
// ЗАКРИТИ ФОРМУ
// ========================================

function closeStudentForm() {

    const modal =
        document.getElementById("studentModal");


    if (modal) {
        modal.classList.remove("show");
    }


    editingStudentId = null;
}


// ========================================
// ЗБЕРЕГТИ СТУДЕНТА
// ========================================

function saveStudent() {

    const input =
        document.getElementById("studentName");


    if (!input) {
        return;
    }


    const name =
        input.value.trim();


    if (!name) {

        alert(
            "Введіть ім'я та прізвище."
        );

        return;
    }


    // РЕДАГУВАННЯ
    if (editingStudentId) {

        const student =
            data.students.find(
                item =>
                    item.id === editingStudentId
            );


        if (student) {
            student.name = name;
        }


    // НОВИЙ СТУДЕНТ
    } else {

        data.students.push({

            id: createId(),

            name: name

        });

    }


    saveData();

    closeStudentForm();

    renderStudents();

    renderJournal();

    renderHistory();
}


// ========================================
// РЕДАГУВАННЯ СТУДЕНТА
// ========================================

function editStudent(id) {

    const student =
        data.students.find(
            item => item.id === id
        );


    if (!student) {
        return;
    }


    editingStudentId = id;


    const title =
        document.getElementById("modalTitle");

    const input =
        document.getElementById("studentName");

    const modal =
        document.getElementById("studentModal");


    if (title) {
        title.textContent =
            "Редагувати студента";
    }


    if (input) {
        input.value = student.name;
    }


    if (modal) {
        modal.classList.add("show");
    }


    setTimeout(() => {

        if (input) {
            input.focus();
        }

    }, 100);
}


// ========================================
// ВИДАЛЕННЯ СТУДЕНТА
// ========================================

function deleteStudent(id) {

    const student =
        data.students.find(
            item => item.id === id
        );


    if (!student) {
        return;
    }


    const ok =
        confirm(
            `Видалити студента "${student.name}"?`
        );


    if (!ok) {
        return;
    }


    // Видаляємо тільки зі списку студентів.
    //
    // Старі відмітки НЕ видаляємо,
    // щоб історія за минулі дати
    // залишилася.
    data.students =
        data.students.filter(
            item => item.id !== id
        );


    saveData();

    renderStudents();

    renderJournal();

    renderHistory();
}


// ========================================
// ІСТОРІЯ
// ========================================

function renderHistory() {

    const list =
        document.getElementById("historyList");


    if (!list) {
        return;
    }


    const dates =
        Object.keys(data.journals || {})
            .filter(date => {
                return (
                    data.journals[date] &&
                    typeof data.journals[date] === "object"
                );
            })
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


    list.innerHTML =
        dates.map(date => {

            const journal =
                data.journals[date] || {};


            let present = 0;
            let absent = 0;
            let sick = 0;
            let reason = 0;


            Object.values(journal)
                .forEach(status => {

                    if (status === "present") {
                        present++;
                    }

                    if (status === "absent") {
                        absent++;
                    }

                    if (status === "sick") {
                        sick++;
                    }

                    if (status === "reason") {
                        reason++;
                    }

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


// ========================================
// ВІДКРИТИ ДЕНЬ З ІСТОРІЇ
// ========================================

function openHistory(date) {

    const dateInput =
        document.getElementById("journalDate");


    if (dateInput) {
        dateInput.value = date;
    }


    showPage("journal");
}


// ========================================
// ФОРМАТУВАННЯ ДАТИ
// ========================================

function formatDate(date) {

    if (!date) {
        return "";
    }


    const parts =
        date.split("-");


    if (parts.length !== 3) {
        return date;
    }


    return `
        ${parts[2]}.
        ${parts[1]}.
        ${parts[0]}
    `.replace(/\s/g, "");
}


// ========================================
// СТВОРЕННЯ ID
// ========================================

function createId() {

    // Сучасний браузер
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }


    // Запасний варіант
    return (
        Date.now().toString(36) +
        Math.random()
            .toString(36)
            .substring(2)
    );
}


// ========================================
// БЕЗПЕЧНИЙ HTML
// ========================================

function escapeHtml(text) {

    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// ========================================
// ЗАКРИТТЯ МОДАЛЬНОГО ВІКНА
// ПРИ НАТИСКАННІ ПОЗА ФОРМОЮ
// ========================================

document.addEventListener(
    "click",
    function(event) {

        const modal =
            document.getElementById("studentModal");


        if (!modal) {
            return;
        }


        if (
            event.target === modal
        ) {
            closeStudentForm();
        }

    }
);


// ========================================
// ENTER У ФОРМІ
// ========================================

document.addEventListener(
    "keydown",
    function(event) {

        if (event.key !== "Enter") {
            return;
        }


        const modal =
            document.getElementById("studentModal");


        if (
            modal &&
            modal.classList.contains("show")
        ) {
            saveStudent();
        }

    }
);


// ========================================
// ЗМІНА ДАТИ
// ========================================

const journalDate =
    document.getElementById("journalDate");


if (journalDate) {

    journalDate.addEventListener(
        "change",
        function() {

            renderJournal();

        }
    );

}


// ========================================
// ЗАПУСК ПРОГРАМИ
// ========================================

loadData();


// Встановлюємо сьогоднішню дату
if (journalDate) {
    journalDate.value = today();
}


// Відкриваємо журнал
showPage("journal");


// ========================================
// PWA SERVICE WORKER
// ========================================

if ("serviceWorker" in navigator) {

    window.addEventListener(
        "load",
        function() {

            navigator.serviceWorker
                .register("/sw.js")
                .catch(error => {

                    console.log(
                        "Service Worker error:",
                        error
                    );

                });

        }
    );

}
```
