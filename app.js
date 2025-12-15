const STD_ID = "12428270";
const API_KEY = "nYs43u5f1oGK9";
const API_BASE = "https://portal.almasar101.com/assignment/api";

const form = document.getElementById("task-form");
const input = document.getElementById("task-input");
const timeFrom = document.getElementById("task-time-from");
const timeTo = document.getElementById("task-time-to");
const dayInput = document.getElementById("task-day");
const taskList = document.getElementById("task-list");
const completedList = document.getElementById("completed-list");

const totalTasks = document.getElementById("total-tasks");
const pendingTasks = document.getElementById("pending-tasks");
const completedCount = document.getElementById("completed-count");
const taskCount = document.getElementById("task-count");
const progressFill = document.getElementById("progress-fill");
const completionRate = document.getElementById("completion-rate");

const statusDiv = document.createElement("div");
statusDiv.style.marginTop = "10px";
statusDiv.style.fontSize = "14px";
form.after(statusDiv);

function setStatus(message, isError = false) {
  statusDiv.textContent = message || "";
  statusDiv.style.color = isError ? "#d9363e" : "#666";
}

function getMeta() {
  return JSON.parse(localStorage.getItem("taskMeta") || "{}");
}

function saveMeta(data) {
  localStorage.setItem("taskMeta", JSON.stringify(data));
}

document.addEventListener("DOMContentLoaded", loadTasks);

async function loadTasks() {
  try {
    setStatus("Loading tasks...");
    const res = await fetch(`${API_BASE}/get.php?stdid=${encodeURIComponent(STD_ID)}&key=${encodeURIComponent(API_KEY)}`);
    if (!res.ok) throw new Error("Failed to load tasks");

    const data = await res.json();
    taskList.innerHTML = "";
    completedList.innerHTML = "";

    if (data.success) {
      data.tasks.forEach(task => appendTaskToList(task));
      updateStats();
      setStatus("");
    }
  } catch (err) {
    console.error(err);
    setStatus(err.message, true);
  }
}

form.addEventListener("submit", async e => {
  e.preventDefault();

  const title = input.value.trim();
  if (!title) return;

  try {
    setStatus("Adding task...");
    const url = `${API_BASE}/add.php?stdid=${encodeURIComponent(STD_ID)}&key=${encodeURIComponent(API_KEY)}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title })
    });

    if (!res.ok) throw new Error("Failed to add task");

    const data = await res.json();
    if (!data.success) throw new Error("Add task failed");

    const meta = getMeta();
    meta[data.task.id] = {
      day: dayInput.value,
      time: `${timeFrom.value} - ${timeTo.value}`,
      done: false
    };
    saveMeta(meta);

    appendTaskToList(data.task);
    input.value = "";
    updateStats();
    setStatus("Task added successfully");
  } catch (err) {
    console.error(err);
    setStatus(err.message, true);
  }
});

function appendTaskToList(task) {
  const meta = getMeta()[task.id];
  if (!meta) return;

  const li = document.createElement("li");
  li.className = "task-item";
  if (meta.done) li.classList.add("task-done");

  const left = document.createElement("div");
  left.className = "task-left";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = meta.done;

  checkbox.onchange = () => {
    const m = getMeta();
    m[task.id].done = checkbox.checked;
    saveMeta(m);

    li.classList.toggle("task-done", checkbox.checked);
    checkbox.checked ? completedList.appendChild(li) : taskList.appendChild(li);
    updateStats();
  };

  const text = document.createElement("div");

  const titleEl = document.createElement("div");
  titleEl.className = "task-title";
  titleEl.textContent = task.title;

  const metaEl = document.createElement("div");
  metaEl.className = "task-meta";
  metaEl.textContent = meta.day + " • " + meta.time;

  text.append(titleEl, metaEl);
  left.append(checkbox, text);

  const del = document.createElement("button");
  del.className = "task-delete";
  del.textContent = "Delete";
  del.onclick = () => deleteTask(task.id, li);

  li.append(left, del);
  meta.done ? completedList.appendChild(li) : taskList.appendChild(li);
}

async function deleteTask(id, li) {
  if (!confirm("Delete this task?")) return;

  try {
    setStatus("Deleting task...");
    const res = await fetch(`${API_BASE}/delete.php?stdid=${encodeURIComponent(STD_ID)}&key=${encodeURIComponent(API_KEY)}&id=${id}`);
    if (!res.ok) throw new Error("Failed to delete task");

    const data = await res.json();
    if (!data.success) throw new Error("Delete failed");

    li.remove();
    const meta = getMeta();
    delete meta[id];
    saveMeta(meta);
    updateStats();
    setStatus("Task deleted");
  } catch (err) {
    console.error(err);
    setStatus(err.message, true);
  }
}

function updateStats() {
  const tasks = Object.values(getMeta());
  const done = tasks.filter(t => t.done).length;

  totalTasks.textContent = tasks.length;
  pendingTasks.textContent = tasks.length - done;
  completedCount.textContent = done;
  taskCount.textContent = tasks.length;

  const rate = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  completionRate.textContent = rate + "%";
  progressFill.style.width = rate + "%";
}
