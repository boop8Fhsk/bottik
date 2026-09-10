/* =========================================================
   ЕЛЕКТРОННИЙ ЖУРНАЛ — SUPABASE VERSION
   ========================================================= */

const SUPABASE_URL = "https://kawosmrbmcpkhurnapoy.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_0JZSbpUCLoFcbh6FZ8LRkQ_FR9AFDPr";

const { createClient } = window.supabase;

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);


/* =========================================================
   СТАН
   ========================================================= */

let students = [];
let attendance = {};

let selectedDate = getToday();

let currentStudentId = null;
let editingStudentId = null;


/* =========================================================
   DOM
   ========================================================= */

const dateInput = document.querySelector("#date");

const studentsList =
  document.querySelector("#students-list") ||
  document.querySelector(".students-list");

const historyList =
  document.querySelector("#history-list") ||
  document.querySelector(".history-list");


/* =========================================================
   ДОПОМІЖНІ ФУНКЦІЇ
   ========================================================= */

function getToday() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function showMessage(message, type = "success") {
  let box = document.querySelector("#journal-message");

  if (!box) {
    box = document.createElement("div");
    box.id = "journal-message";

    box.style.position = "fixed";
    box.style.left = "50%";
    box.style.bottom = "20px";
    box.style.transform = "translateX(-50%)";
    box.style.zIndex = "99999";
    box.style.padding = "12px 18px";
    box.style.borderRadius = "12px";
    box.style.background = "#222";
    box.style.color = "#fff";
    box.style.fontSize = "15px";
    box.style.boxShadow = "0 5px 20px rgba(0,0,0,.2)";

    document.body.appendChild(box);
  }

  box.textContent = message;

  if (type === "error") {
    box.style.background = "#b42318";
  } else {
    box.style.background = "#167c3a";
  }

  clearTimeout(box._timer);

  box._timer = setTimeout(() => {
    box.remove();
  }, 3000);
}


/* =========================================================
   SUPABASE — СТУДЕНТИ
   ========================================================= */

async function loadStudents() {
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Помилка завантаження студентів:", error);
    showMessage(
      "Не вдалося завантажити студентів: " + error.message,
      "error"
    );
    return;
  }

  students = data || [];

  renderStudents();
}


/* =========================================================
   SUPABASE — ВІДВІДУВАННЯ
   ========================================================= */

async function loadAttendanceForDate(date) {
  const { data, error } = await supabase
    .from("attendance")
    .select("*")
    .eq("date", date);

  if (error) {
    console.error("Помилка завантаження відвідування:", error);
    showMessage(
      "Не вдалося завантажити відвідування: " + error.message,
      "error"
    );
    return;
  }

  attendance = {};

  (data || []).forEach(row => {
    attendance[row.student_id] = row.status;
  });

  renderStudents();
}


async function loadAllAttendance() {
  const { data, error } = await supabase
    .from("attendance")
    .select("*")
    .order("date", { ascending: false });

  if (error) {
    console.error("Помилка завантаження історії:", error);
    showMessage(
      "Не вдалося завантажити історію: " + error.message,
      "error"
    );
    return;
  }

  renderHistory(data || []);
}


/* =========================================================
   ДОДАТИ СТУДЕНТА
   ========================================================= */

async function addStudent(name) {
  name = String(name || "").trim();

  if (!name) {
    showMessage("Введи ім'я та прізвище", "error");
    return;
  }

  const { data, error } = await supabase
    .from("students")
    .insert({
      name: name
    })
    .select()
    .single();

  if (error) {
    console.error("Помилка додавання студента:", error);

    showMessage(
      "Не вдалося додати студента: " + error.message,
      "error"
    );

    return;
  }

  students.push(data);

  renderStudents();

  showMessage("Студента додано");

  closeStudentModal();
}


/* =========================================================
   РЕДАГУВАТИ СТУДЕНТА
   ========================================================= */

async function updateStudent(id, name) {
  name = String(name || "").trim();

  if (!name) {
    showMessage("Ім'я не може бути порожнім", "error");
    return;
  }

  const { data, error } = await supabase
    .from("students")
    .update({
      name: name
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Помилка редагування студента:", error);

    showMessage(
      "Не вдалося змінити студента: " + error.message,
      "error"
    );

    return;
  }

  const index = students.findIndex(student => student.id === id);

  if (index !== -1) {
    students[index] = data;
  }

  renderStudents();

  showMessage("Дані студента змінено");

  closeStudentModal();
}


/* =========================================================
   ВИДАЛИТИ СТУДЕНТА
   ========================================================= */

async function deleteStudent(id) {
  const student = students.find(s => s.id === id);

  if (!student) {
    return;
  }

  const confirmed = confirm(
    `Видалити студента "${student.name}"?`
  );

  if (!confirmed) {
    return;
  }

  const { error } = await supabase
    .from("students")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Помилка видалення студента:", error);

    showMessage(
      "Не вдалося видалити студента: " + error.message,
      "error"
    );

    return;
  }

  students = students.filter(student => student.id !== id);

  delete attendance[id];

  renderStudents();

  showMessage("Студента видалено");
}


/* =========================================================
   ВІДМІТКА ВІДВІДУВАННЯ
   ========================================================= */

async function setAttendance(studentId, status) {
  const currentStatus = attendance[studentId];

  /*
     Якщо натиснули на вже активну відмітку —
     видаляємо її.
  */

  if (currentStatus === status) {
    const { error } = await supabase
      .from("attendance")
      .delete()
      .eq("student_id", studentId)
      .eq("date", selectedDate);

    if (error) {
      console.error("Помилка видалення відмітки:", error);

      showMessage(
        "Не вдалося змінити відмітку: " + error.message,
        "error"
      );

      return;
    }

    delete attendance[studentId];

    renderStudents();

    return;
  }


  /*
     Нова або змінена відмітка.
  */

  const { data, error } = await supabase
    .from("attendance")
    .upsert(
      {
        student_id: studentId,
        date: selectedDate,
        status: status
      },
      {
        onConflict: "student_id,date"
      }
    )
    .select()
    .single();

  if (error) {
    console.error("Помилка збереження відвідування:", error);

    showMessage(
      "Не вдалося зберегти відмітку: " + error.message,
      "error"
    );

    return;
  }

  attendance[studentId] = data.status;

  renderStudents();

  showMessage("Відмітку збережено");
}


/* =========================================================
   РЕНДЕР СТУДЕНТІВ
   ========================================================= */

function renderStudents() {
  if (!studentsList) {
    return;
  }

  if (students.length === 0) {
    studentsList.innerHTML = `
      <div class="empty-state">
        Немає доданих студентів
      </div>
    `;

    return;
  }

  studentsList.innerHTML = students
    .map(student => {
      const status = attendance[student.id];

      return `
        <div class="student-card" data-id="${student.id}">

          <div class="student-info">
            <div class="student-name">
              ${escapeHtml(student.name)}
            </div>
          </div>

          <div class="attendance-buttons">

            <button
              class="attendance-btn ${status === "present" ? "active" : ""}"
              data-action="attendance"
              data-status="present"
              data-id="${student.id}"
              title="Присутній"
            >
              ✅
            </button>

            <button
              class="attendance-btn ${status === "absent" ? "active" : ""}"
              data-action="attendance"
              data-status="absent"
              data-id="${student.id}"
              title="Відсутній"
            >
              ❌
            </button>

            <button
              class="attendance-btn ${status === "sick" ? "active" : ""}"
              data-action="attendance"
              data-status="sick"
              data-id="${student.id}"
              title="Хворіє"
            >
              🤒
            </button>

            <button
              class="attendance-btn ${status === "reason" ? "active" : ""}"
              data-action="attendance"
              data-status="reason"
              data-id="${student.id}"
              title="Поважна причина"
            >
              📝
            </button>

          </div>

          <div class="student-actions">

            <button
              class="edit-student-btn"
              data-action="edit"
              data-id="${student.id}"
            >
              ✏️
            </button>

            <button
              class="delete-student-btn"
              data-action="delete"
              data-id="${student.id}"
            >
              🗑️
            </button>

          </div>

        </div>
      `;
    })
    .join("");
}


/* =========================================================
   ІСТОРІЯ
   ========================================================= */

function renderHistory(rows) {
  if (!historyList) {
    return;
  }

  if (!rows.length) {
    historyList.innerHTML = `
      <div class="empty-state">
        Історія поки порожня
      </div>
    `;

    return;
  }

  const grouped = {};

  rows.forEach(row => {
    if (!grouped[row.date]) {
      grouped[row.date] = [];
    }

    grouped[row.date].push(row);
  });

  const dates = Object.keys(grouped).sort(
    (a, b) => b.localeCompare(a)
  );

  historyList.innerHTML = dates
    .map(date => {
      const dateRows = grouped[date];

      const studentsRows = dateRows
        .map(row => {
          const student = students.find(
            student => student.id === row.student_id
          );

          const studentName = student
            ? student.name
            : "Студент видалений";

          const statusText = getStatusText(row.status);

          return `
            <div class="history-student">
              <span>
                ${escapeHtml(studentName)}
              </span>

              <span>
                ${statusText}
              </span>
            </div>
          `;
        })
        .join("");

      return `
        <div class="history-date">

          <div class="history-date-title">
            📅 ${formatDate(date)}
          </div>

          <div class="history-students">
            ${studentsRows}
          </div>

        </div>
      `;
    })
    .join("");
}


function getStatusText(status) {
  switch (status) {
    case "present":
      return "✅ Присутній";

    case "absent":
      return "❌ Відсутній";

    case "sick":
      return "🤒 Хворіє";

    case "reason":
      return "📝 Поважна причина";

    default:
      return status || "";
  }
}


function formatDate(date) {
  const parts = date.split("-");

  if (parts.length !== 3) {
    return date;
  }

  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}


/* =========================================================
   МОДАЛЬНЕ ВІКНО СТУДЕНТА
   ========================================================= */

function openStudentModal(student = null) {
  const modal =
    document.querySelector("#student-modal") ||
    document.querySelector(".modal");

  if (!modal) {
    return;
  }

  editingStudentId = student ? student.id : null;

  const input =
    modal.querySelector("input") ||
    document.querySelector("#student-name");

  if (input) {
    input.value = student ? student.name : "";
    input.focus();
  }

  modal.classList.add("show");
  modal.classList.add("active");
}


function closeStudentModal() {
  const modal =
    document.querySelector("#student-modal") ||
    document.querySelector(".modal");

  if (!modal) {
    return;
  }

  modal.classList.remove("show");
  modal.classList.remove("active");

  editingStudentId = null;
}


/* =========================================================
   ЗБЕРЕЖЕННЯ СТУДЕНТА З МОДАЛЬНОГО ВІКНА
   ========================================================= */

async function saveStudentFromModal() {
  const modal =
    document.querySelector("#student-modal") ||
    document.querySelector(".modal");

  const input =
    modal?.querySelector("input") ||
    document.querySelector("#student-name");

  if (!input) {
    return;
  }

  const name = input.value.trim();

  if (!name) {
    showMessage("Введи ім'я та прізвище", "error");
    return;
  }

  if (editingStudentId) {
    await updateStudent(editingStudentId, name);
  } else {
    await addStudent(name);
  }
}


/* =========================================================
   ПОДІЇ
   ========================================================= */

document.addEventListener("click", async event => {
  const button = event.target.closest("[data-action]");

  if (button) {
    const action = button.dataset.action;
    const id = button.dataset.id;

    if (action === "attendance") {
      const status = button.dataset.status;

      await setAttendance(id, status);
      return;
    }

    if (action === "edit") {
      const student = students.find(
        student => student.id === id
      );

      if (student) {
        openStudentModal(student);
      }

      return;
    }

    if (action === "delete") {
      await deleteStudent(id);
      return;
    }
  }


  /*
     Кнопка "Додати"
  */

  const addButton =
    event.target.closest("#add-student") ||
    event.target.closest(".add-student") ||
    event.target.closest("[data-add-student]");

  if (addButton) {
    openStudentModal();
    return;
  }


  /*
     Закриття модального вікна
  */

  const closeButton =
    event.target.closest("[data-close-modal]") ||
    event.target.closest(".modal-close") ||
    event.target.closest(".close-modal");

  if (closeButton) {
    closeStudentModal();
    return;
  }


  /*
     Збереження студента
  */

  const saveButton =
    event.target.closest("#save-student") ||
    event.target.closest("[data-save-student]");

  if (saveButton) {
    await saveStudentFromModal();
    return;
  }


  /*
     Відкрити історію
  */

  const historyButton =
    event.target.closest("#history-button") ||
    event.target.closest("[data-history]");

  if (historyButton) {
    await loadAllAttendance();
    return;
  }
});


/* =========================================================
   ENTER У ПОЛІ ІМЕНІ
   ========================================================= */

document.addEventListener("keydown", async event => {
  if (event.key !== "Enter") {
    return;
  }

  const target = event.target;

  if (
    target.matches("#student-name") ||
    target.matches(".student-modal input") ||
    target.matches(".modal input")
  ) {
    event.preventDefault();

    await saveStudentFromModal();
  }
});


/* =========================================================
   ЗМІНА ДАТИ
   ========================================================= */

if (dateInput) {
  dateInput.value = selectedDate;

  dateInput.addEventListener("change", async event => {
    selectedDate = event.target.value || getToday();

    await loadAttendanceForDate(selectedDate);
  });
}


/* =========================================================
   ЗАКРИТТЯ МОДАЛЬНОГО ВІКНА ПО ФОНУ
   ========================================================= */

document.addEventListener("click", event => {
  const modal = event.target.closest(".modal");

  if (!modal) {
    return;
  }

  if (event.target === modal) {
    closeStudentModal();
  }
});


/* =========================================================
   ПОЧАТКОВЕ ЗАВАНТАЖЕННЯ
   ========================================================= */

async function initJournal() {
  console.log("📖 Запуск електронного журналу...");

  try {
    await loadStudents();
    await loadAttendanceForDate(selectedDate);

    console.log("✅ Журнал підключено до Supabase");
  } catch (error) {
    console.error("Критична помилка:", error);

    showMessage(
      "Не вдалося підключити журнал до Supabase",
      "error"
    );
  }
}


initJournal();


/* =========================================================
   ПЕРЕВІРКА ПІДКЛЮЧЕННЯ
   ========================================================= */

window.journalSupabase = supabase;

console.log("☁️ Supabase URL:", SUPABASE_URL);
console.log("☁️ Електронний журнал працює через Supabase");
