const apiUrlInput = document.getElementById("api-url");
const loadButton = document.getElementById("load-items");
const newButton = document.getElementById("new-item");
const list = document.getElementById("item-list");
const status = document.getElementById("status");
const dialog = document.getElementById("item-dialog");
const form = document.getElementById("item-form");
const dayList = document.getElementById("day-list");
const dayDialog = document.getElementById("day-dialog");
const dayForm = document.getElementById("day-form");
const DEFAULT_ADMIN_API_URL = "";
let data = { days: [], items: [] };
let editingId = null;
let editingDayId = null;
let requestedItemId = new URLSearchParams(window.location.search).get("item");

apiUrlInput.value = localStorage.getItem("roadtripAdminApiUrl") || DEFAULT_ADMIN_API_URL;

function showStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle("error", isError);
}

function apiUrl() { return apiUrlInput.value.trim(); }

async function jsonFrom(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (error) {
    const pageTitle = text.match(/<title[^>]*>([^<]+)/i)?.[1]?.trim();
    throw new Error(pageTitle
      ? `The admin API returned an HTML page: ${pageTitle}. Check the Apps Script deployment access setting.`
      : "The admin API returned HTML instead of JSON. Check the Apps Script deployment access setting.");
  }
}

async function callApi(action, values = {}) {
  if (!apiUrl()) throw new Error("Add the deployed admin API URL first.");
  const body = new URLSearchParams({ action, ...values });
  const response = await fetch(apiUrl(), { method: "POST", body });
  const result = await jsonFrom(response);
  if (!response.ok || !result.ok) throw new Error(result.error || "The admin API request failed.");
  return result;
}

async function loadItems() {
  if (!apiUrl()) return showStatus("Add the deployed admin API URL first.", true);
  showStatus("Loading items…");
  try {
    const response = await fetch(`${apiUrl()}?action=list`, { cache: "no-store" });
    const result = await jsonFrom(response);
    if (!response.ok || !result.ok) throw new Error(result.error || "Unable to load items.");
    data = result;
    render();
    renderDays();
    newButton.disabled = false;
    if (requestedItemId) {
      const item = data.items.find(value => String(value.id) === requestedItemId);
      requestedItemId = null;
      if (item) openEditor(item);
      else showStatus("That item is no longer available.", true);
    }
    showStatus(`${data.items.length} items loaded.`);
  } catch (error) { showStatus(error.message, true); }
}

function escapeHtml(value) {
  const el = document.createElement("div"); el.textContent = value || ""; return el.innerHTML;
}

function dayLabel(id) {
  const day = data.days.find(value => String(value.id) === String(id));
  return day ? formatDay(day.date) : `Day ${id}`;
}

function formatDay(value) {
  const text = String(value || "");
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Number(iso[2]) - 1]}`;
  const named = text.match(/(?:[A-Za-z]{3,}\s+)?(\d{1,2})\s+([A-Za-z]{3,})/);
  if (named) return `${named[1].padStart(2, "0")} ${named[2].slice(0, 3)}`;
  return text;
}

function formatTime(value) {
  const match = String(value || "").match(/(?:T|\b)(\d{1,2}):(\d{2})/);
  return match ? `${match[1].padStart(2, "0")}:${match[2]}` : "";
}

function nextOrderForDay(dayId) {
  return data.items
    .filter(item => String(item.day) === String(dayId))
    .reduce((highest, item) => Math.max(highest, Number(item.order) || 0), 0) + 1;
}

function render() {
  const items = [...data.items].sort((a, b) => Number(a.day) - Number(b.day) || Number(a.order) - Number(b.order));
  list.innerHTML = items.length ? items.map(item => `<tr>
    <td>${escapeHtml(dayLabel(item.day))}</td><td>${escapeHtml(item.order)}</td><td>${escapeHtml(item.type)}</td>
    <td class="title">${escapeHtml(item.title)}</td><td>${escapeHtml(formatTime(item.start))}</td><td>${escapeHtml(formatTime(item.end))}</td>
    <td class="notes" title="${escapeHtml(item.notes)}">${escapeHtml(item.notes)}</td>
    <td><div class="actions"><button class="icon secondary" data-action="up" data-id="${escapeHtml(item.id)}" title="Move up">↑</button><button class="icon secondary" data-action="down" data-id="${escapeHtml(item.id)}" title="Move down">↓</button><button class="icon secondary" data-action="add-below" data-id="${escapeHtml(item.id)}" title="Add an item below">+</button><button class="icon secondary" data-action="edit" data-id="${escapeHtml(item.id)}">Edit</button><button class="icon danger" data-action="delete" data-id="${escapeHtml(item.id)}">Delete</button></div></td>
  </tr>`).join("") : '<tr><td colspan="8" class="hint">No items found.</td></tr>';
}

function renderDays() {
  dayList.innerHTML = data.days.length ? data.days.map(day => `<tr>
    <td>${escapeHtml(formatDay(day.date))}</td><td class="notes" title="${escapeHtml(day.notes)}">${escapeHtml(day.notes)}</td>
    <td><button class="secondary" data-day-id="${escapeHtml(day.id)}">Edit</button></td>
  </tr>`).join("") : '<tr><td colspan="3" class="hint">No days found.</td></tr>';
}

function openEditor(item = {}) {
  editingId = item.id || null;
  document.getElementById("dialog-title").textContent = editingId ? "Edit item" : "New item";
  const day = document.getElementById("item-day");
  day.innerHTML = data.days.map(value => `<option value="${escapeHtml(value.id)}">${escapeHtml(formatDay(value.date))}</option>`).join("");
  ["day", "order", "type", "title", "start", "end", "notes", "from", "to", "travelMode", "link", "mapUrl", "directionUrl"].forEach(key => {
    const input = document.getElementById(`item-${key.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`)}`);
    if (input) input.value = key === "start" || key === "end" ? formatTime(item[key]) : (item[key] || "");
  });
  dialog.showModal();
}

function formValues() {
  return Object.fromEntries(["day", "order", "type", "title", "start", "end", "notes", "from", "to", "travelMode", "link", "mapUrl", "directionUrl"].map(key => {
    const id = `item-${key.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`)}`;
    return [key, document.getElementById(id).value.trim()];
  }));
}

document.getElementById("save-api").addEventListener("click", () => {
  localStorage.setItem("roadtripAdminApiUrl", apiUrl());
  showStatus("Admin API URL saved in this browser.");
});
loadButton.addEventListener("click", loadItems);
newButton.addEventListener("click", () => {
  const day = data.days[0]?.id;
  openEditor({ day, order: nextOrderForDay(day), type: "Activity" });
});
document.getElementById("close-dialog").addEventListener("click", () => dialog.close());
document.getElementById("cancel-item").addEventListener("click", () => dialog.close());

form.addEventListener("submit", async event => {
  event.preventDefault();
  try {
    await callApi(editingId ? "update" : "create", { ...formValues(), ...(editingId ? { id: editingId } : {}) });
    dialog.close(); await loadItems(); showStatus("Item saved.");
  } catch (error) { showStatus(error.message, true); }
});

list.addEventListener("click", async event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const item = data.items.find(value => String(value.id) === button.dataset.id);
  if (!item) return;
  if (button.dataset.action === "edit") return openEditor(item);
  if (button.dataset.action === "add-below") return openEditor({ day: item.day, order: Number(item.order || 0) + 1, start: formatTime(item.end) || formatTime(item.start), type: item.type || "Activity" });
  if (button.dataset.action === "delete" && !confirm(`Delete “${item.title}”?`)) return;
  try {
    await callApi(button.dataset.action, { id: item.id });
    await loadItems(); showStatus(button.dataset.action === "delete" ? "Item deleted." : "Item moved.");
  } catch (error) { showStatus(error.message, true); }
});

dayList.addEventListener("click", event => {
  const button = event.target.closest("button[data-day-id]");
  const day = data.days.find(value => String(value.id) === button?.dataset.dayId);
  if (!day) return;
  editingDayId = day.id;
  document.getElementById("day-date").value = day.date || "";
  document.getElementById("day-notes").value = day.notes || "";
  dayDialog.showModal();
});
document.getElementById("close-day-dialog").addEventListener("click", () => dayDialog.close());
document.getElementById("cancel-day").addEventListener("click", () => dayDialog.close());
dayForm.addEventListener("submit", async event => {
  event.preventDefault();
  try {
    await callApi("updateDay", { id: editingDayId, date: document.getElementById("day-date").value.trim(), notes: document.getElementById("day-notes").value.trim() });
    dayDialog.close(); await loadItems(); showStatus("Day saved.");
  } catch (error) { showStatus(error.message, true); }
});

if (apiUrl()) loadItems();
