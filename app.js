const LOCAL_STORAGE_KEY_TODO = "todo-tasks-v1";

class Todo {
  constructor(htmlElementWithList) {
    this.htmlElementWithList = htmlElementWithList;
    this.arrayWithTasks = [];
    this.currentSearchTermString = "";
    this.currentlyEditedTaskContext = null;

    this.loadTasksFromLocalStorage();

    if (this.arrayWithTasks.length === 0) {
      this.arrayWithTasks = [
        { id: crypto.randomUUID(), name: "Zrobić kawę", date: "2025-10-17", done: false },
        { id: crypto.randomUUID(), name: "Zrobić jogę", date: "2025-10-17", done: false }
      ];
      this.saveTasksToLocalStorage();
    }

    this.drawEverythingOnScreenAgain();
  }

  getFilteredTasksArray() {
    const s = (this.currentSearchTermString || "").trim().toLowerCase();
    if (s.length < 2) return this.arrayWithTasks;
    return this.arrayWithTasks.filter(t => (t.name || "").toLowerCase().includes(s));
  }

  setSearchTermString(val) {
    this.currentSearchTermString = val || "";
    this.drawEverythingOnScreenAgain();
  }

  addNewTaskToArray(name, date) {
    const e = this.validateTaskNameAndDate(name, date);
    if (e) return e;
    this.arrayWithTasks.push({
      id: crypto.randomUUID(),
      name: (name || "").trim(),
      date: (date || "").trim() || "",
      done: false
    });
    this.saveTasksToLocalStorage();
    this.drawEverythingOnScreenAgain();
    return "";
  }

  toggleTaskDoneById(id, ch) {
    const t = this.arrayWithTasks.find(x => x.id === id);
    if (t) {
      t.done = !!ch;
      this.saveTasksToLocalStorage();
      this.drawEverythingOnScreenAgain();
    }
  }

  removeTaskByIdAndRedraw(id) {
    this.arrayWithTasks = this.arrayWithTasks.filter(x => x.id !== id);
    this.saveTasksToLocalStorage();
    this.drawEverythingOnScreenAgain();
  }

  startEditingTaskWithId(id) {
    this.currentlyEditedTaskContext = { id };
    this.drawEverythingOnScreenAgain();
    const li = this.htmlElementWithList.querySelector(`li[data-id="${id}"]`);
    const nameInput = li ? li.querySelector(".todo-name-input") : null;
    if (nameInput) {
      nameInput.focus();
      const len = nameInput.value.length;
      nameInput.setSelectionRange(len, len);
    }

    const f = (e) => {
      const r = this.htmlElementWithList.querySelector(`li[data-id="${id}"]`);
      if (!r || !r.contains(e.target)) {
        this.finishEditingTaskWithId(id);
        document.removeEventListener("mousedown", f);
      }
    };
    document.addEventListener("mousedown", f);
  }

  finishEditingTaskWithId(id) {
    const li = this.htmlElementWithList.querySelector(`li[data-id="${id}"]`);
    if (!li) {
      this.currentlyEditedTaskContext = null;
      this.drawEverythingOnScreenAgain();
      return;
    }

    const nameEl = li.querySelector(".todo-name-input") || li.querySelector(".todo-name-span");
    const dateEl = li.querySelector(".todo-date-input");
    const newName = nameEl ? (nameEl.value || nameEl.textContent || "") : "";
    const newDate = dateEl ? (dateEl.value || "") : "";
    const e = this.validateTaskNameAndDate(newName, newDate);
    if (e) {
      if (nameEl.setCustomValidity) {
        nameEl.setCustomValidity(e);
        nameEl.reportValidity();
      }
      return;
    }

    const t = this.arrayWithTasks.find(x => x.id === id);
    if (t) {
      t.name = (newName || "").trim();
      t.date = (newDate || "").trim();
      this.saveTasksToLocalStorage();
    }

    this.currentlyEditedTaskContext = null;
    this.drawEverythingOnScreenAgain();
  }

  validateTaskNameAndDate(name, date) {
    const n = (name || "").trim();
    if (n.length < 3) return "Zadanie musi mieć co najmniej 3 znaki.";
    if (n.length > 255) return "Zadanie może mieć maksymalnie 255 znaków.";

    if (date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const d = new Date(date + "T00:00:00");
      if (!(d instanceof Date) || isNaN(d.getTime())) return "Nieprawidłowa data.";
      if (d <= today) return "Data musi być w przyszłości (albo zostaw pustą).";
    }
    return "";
  }

  saveTasksToLocalStorage() {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_TODO, JSON.stringify(this.arrayWithTasks));
    } catch {}
  }

  loadTasksFromLocalStorage() {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY_TODO);
      this.arrayWithTasks = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(this.arrayWithTasks)) this.arrayWithTasks = [];
    } catch {
      this.arrayWithTasks = [];
    }
  }

  escapeHtmlVerySimple(t) {
    return (t ?? "").toString()
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }

  drawEverythingOnScreenAgain() {
    this.htmlElementWithList.innerHTML = "";
    const arr = this.getFilteredTasksArray();
    if (arr.length === 0) {
      const li = document.createElement("li");
      li.innerHTML = "<em>Brak zadań do wyświetlenia.</em>";
      this.htmlElementWithList.appendChild(li);
      return;
    }

    for (const t of arr) {
      const li = document.createElement("li");
      li.dataset.id = t.id;
      if (t.done) li.classList.add("done");

      const check = document.createElement("input");
      check.type = "checkbox";
      check.className = "todo-check";
      check.checked = !!t.done;
      check.addEventListener("change", () => this.toggleTaskDoneById(t.id, check.checked));
      li.appendChild(check);

      const editing = this.currentlyEditedTaskContext && this.currentlyEditedTaskContext.id === t.id;
      if (editing) {
        const inputName = document.createElement("input");
        inputName.type = "text";
        inputName.className = "todo-name-input";
        inputName.value = t.name;
        inputName.addEventListener("keydown", (e) => {
          if (e.key === "Enter") this.finishEditingTaskWithId(t.id);
          if (e.key === "Escape") { this.currentlyEditedTaskContext = null; this.drawEverythingOnScreenAgain(); }
        });
        li.appendChild(inputName);
      } else {
        const spanName = document.createElement("span");
        spanName.className = "todo-name-span";
        spanName.innerHTML = this.highlightTextWithCurrentSearch(t.name);

        li.appendChild(spanName);
      }

      const inputDate = document.createElement("input");
      inputDate.type = "date";
      inputDate.className = "todo-date-input";
      inputDate.value = t.date || "";
      inputDate.disabled = !editing;
      inputDate.addEventListener("keydown", (e) => {
        if (e.key === "Enter") this.finishEditingTaskWithId(t.id);
        if (e.key === "Escape") { this.currentlyEditedTaskContext = null; this.drawEverythingOnScreenAgain(); }
      });
      li.appendChild(inputDate);

      const del = document.createElement("span");
      del.className = "todo-delete";
      del.textContent = "🗑️";
      del.addEventListener("click", () => this.removeTaskByIdAndRedraw(t.id));
      li.appendChild(del);

      const nameClickElement = editing 
  ? li.querySelector(".todo-name-input")
  : li.querySelector(".todo-name-span");

if (nameClickElement) {
  nameClickElement.addEventListener("click", (ev) => {
    if (!editing) this.startEditingTaskWithId(t.id);
  });
}

const dateClickElement = li.querySelector(".todo-date-input");

if (dateClickElement) {
  dateClickElement.addEventListener("click", () => {
    if (!editing) this.startEditingTaskWithId(t.id);
  });
}


      this.htmlElementWithList.appendChild(li);
    }
  }

  highlightTextWithCurrentSearch(text) {
    const q = (this.currentSearchTermString || "").trim();
    if (q.length < 2) return this.escapeHtmlVerySimple(text);
    const safe = this.escapeHtmlVerySimple(text);
    const esc = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(${esc})`, "ig");
    return safe.replace(re, "<mark>$1</mark>");
  }
  
}

document.addEventListener("DOMContentLoaded", () => {
  const listEl   = document.getElementById("todo-list");
  const searchEl = document.getElementById("search");
  const nameEl   = document.getElementById("task-name");
  const dateEl   = document.getElementById("task-date");
  const addBtn   = document.getElementById("add-task");
  const errorEl  = document.getElementById("error");

  const todoAppObject = new Todo(listEl);

  searchEl.addEventListener("input", () => {
    todoAppObject.setSearchTermString(searchEl.value);
  });

  function addFromForm() {
    const err = todoAppObject.addNewTaskToArray(nameEl.value, dateEl.value);
    errorEl.textContent = err;
    if (!err) {
      nameEl.value = "";
      dateEl.value = "";
      nameEl.focus();
    }
  }

  addBtn.addEventListener("click", addFromForm);
  nameEl.addEventListener("keydown", (e) => { if (e.key === "Enter") addFromForm(); });
  dateEl.addEventListener("keydown", (e) => { if (e.key === "Enter") addFromForm(); });
});
