/*
 * Deploy this file as a separate Google Apps Script Web App for admin.html.
 * Sheet columns required:
 *   Itinerary: id, day (a date), order, type, title, start, end, notes, from, to,
 *              travelMode, mapUrl, directionUrl, link
 * A row with type "Summary" provides the day note; it is not shown as an
 * itinerary item by the public endpoint.
 */

const ADMIN_ITEM_SHEET = "Itinerary";
const ITEM_FIELDS = ["day", "order", "type", "title", "start", "end", "notes", "from", "to", "travelMode", "mapUrl", "directionUrl", "link"];
// For a standalone Apps Script project, paste the ID from the spreadsheet URL
// here. Leave empty only when this script is bound directly to that spreadsheet.
const ADMIN_SPREADSHEET_ID = "1NTkw-Ezu3J-vu5Ix_2gSeBXFExAIqQdCj3yR3UzCdqk";

function adminSpreadsheet() {
  const spreadsheet = ADMIN_SPREADSHEET_ID
    ? SpreadsheetApp.openById(ADMIN_SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error("No active spreadsheet. Set ADMIN_SPREADSHEET_ID in Code.gs.");
  }
  return spreadsheet;
}

function doGet(e) {
  try {
    if ((e.parameter.action || "list") !== "list") throw new Error("Unknown action.");
    return jsonResponse({ ok: true, ...readAdminData() });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message });
  }
}

function doPost(e) {
  const lock = LockService.getDocumentLock();
  try {
    lock.waitLock(30000);
    const params = e.parameter || {};
    const action = params.action;
    if (action === "create") createItem(params);
    else if (action === "update") updateItem(params);
    else if (action === "delete") deleteItem(params.id);
    else if (action === "up" || action === "down") moveItem(params.id, action);
    else throw new Error("Unknown action.");
    return jsonResponse({ ok: true, ...readAdminData() });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function jsonResponse(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}

function table(sheetName) {
  const sheet = adminSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error(`Missing sheet: ${sheetName}`);
  const values = sheet.getDataRange().getValues();
  if (!values.length) throw new Error(`${sheetName} needs a header row.`);
  const headers = values.shift().map(value => String(value).trim());
  const index = Object.fromEntries(headers.map((header, position) => [header, position]));
  return { sheet, headers, index, rows: values };
}

function required(tableData, fields) {
  fields.forEach(field => { if (tableData.index[field] === undefined) throw new Error(`Missing “${field}” column in ${tableData.sheet.getName()}.`); });
}

function objectFromRow(row, tableData) {
  return Object.fromEntries(tableData.headers.map((header, index) => [header, row[index] === undefined ? "" : row[index]]));
}

function dateKey(value) {
  if (value instanceof Date) return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd");
  const match = String(value || "").match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : String(value || "").trim();
}

function readAdminData() {
  const items = itemTable();
  const resultItems = items.rows.filter(row => row[items.index.id] !== "").map(row => {
    const value = objectFromRow(row, items);
    const item = Object.fromEntries(["id", ...ITEM_FIELDS].map(field => [field, value[field] || ""]));
    item.day = dateKey(value.day);
    return item;
  });
  return {
    // Kept for admin.html compatibility: dates are derived from the one sheet.
    days: [...new Set(resultItems.map(item => item.day).filter(Boolean))]
      .sort()
      .map(date => ({ id: date, date })),
    items: resultItems
  };
}

function itemTable() {
  let data = table(ADMIN_ITEM_SHEET);
  // The public itinerary did not need a per-item ID. Add one once so the
  // admin editor can reliably update, delete, and move existing rows.
  if (data.index.id === undefined) {
    const column = data.headers.length + 1;
    data.sheet.getRange(1, column).setValue("id");
    if (data.rows.length) {
      data.sheet.getRange(2, column, data.rows.length, 1)
        .setValues(data.rows.map(() => [Utilities.getUuid()]));
    }
    data = table(ADMIN_ITEM_SHEET);
  }

  const blankIds = data.rows
    .map((row, index) => ({ row, index }))
    .filter(value => !value.row[data.index.id]);
  blankIds.forEach(value => {
    data.sheet.getRange(value.index + 2, data.index.id + 1).setValue(Utilities.getUuid());
  });
  if (blankIds.length) data = table(ADMIN_ITEM_SHEET);

  required(data, ["id", "day", "order", "type", "title"]);
  return data;
}

function validateItem(params) {
  if (!params.day || !params.type || (String(params.type).toLowerCase() !== "summary" && !params.title)) {
    throw new Error("Day and type are required; title is required for non-summary items.");
  }
}

function setValue(sheet, rowNumber, index, value) {
  if (index !== undefined) sheet.getRange(rowNumber, index + 1).setValue(value || "");
}

function createItem(params) {
  validateItem(params);
  const data = itemTable();
  const requestedOrder = Number(params.order);
  const order = Number.isFinite(requestedOrder) && requestedOrder > 0 ? requestedOrder : nextOrder(data, params.day);
  if (order < nextOrder(data, params.day)) shiftOrdersFrom(data, params.day, order);
  const row = data.headers.map(header => {
    if (header === "id") return Utilities.getUuid();
    if (header === "order") return order;
    return params[header] || "";
  });
  data.sheet.appendRow(row);
}

function shiftOrdersFrom(data, day, fromOrder) {
  data.rows
    .map((row, index) => ({ row, index, order: Number(row[data.index.order]) || 0 }))
    .filter(value => dateKey(value.row[data.index.day]) === dateKey(day) && value.order >= fromOrder)
    .sort((a, b) => b.order - a.order || b.index - a.index)
    .forEach(value => setValue(data.sheet, value.index + 2, data.index.order, value.order + 1));
}

function findItem(data, id) {
  const index = data.rows.findIndex(row => String(row[data.index.id]) === String(id));
  if (index < 0) throw new Error("Item not found.");
  return { index, rowNumber: index + 2, row: data.rows[index] };
}

function updateItem(params) {
  if (!params.id) throw new Error("Item ID is required.");
  validateItem(params);
  const data = itemTable();
  const item = findItem(data, params.id);
  ITEM_FIELDS.filter(field => field !== "order").forEach(field => setValue(data.sheet, item.rowNumber, data.index[field], params[field]));
  const previousDay = item.row[data.index.day];
  if (dateKey(previousDay) !== dateKey(params.day)) {
    setValue(data.sheet, item.rowNumber, data.index.order, nextOrder(data, params.day));
    rebalanceOrders(data, previousDay);
  }
}

function deleteItem(id) {
  if (!id) throw new Error("Item ID is required.");
  const data = itemTable();
  const item = findItem(data, id);
  const day = item.row[data.index.day];
  data.sheet.deleteRow(item.rowNumber);
  rebalanceOrders(itemTable(), day);
}

function moveItem(id, direction) {
  const data = itemTable();
  const current = findItem(data, id);
  const day = current.row[data.index.day];
  const ordered = data.rows
    .map((row, index) => ({ row, index, order: Number(row[data.index.order]) || 0 }))
    .filter(value => dateKey(value.row[data.index.day]) === dateKey(day))
    .sort((a, b) => a.order - b.order || a.index - b.index);
  const position = ordered.findIndex(value => value.index === current.index);
  const target = ordered[position + (direction === "up" ? -1 : 1)];
  if (!target) return;
  const currentOrder = current.row[data.index.order];
  setValue(data.sheet, current.rowNumber, data.index.order, target.row[data.index.order]);
  setValue(data.sheet, target.index + 2, data.index.order, currentOrder);
}

function nextOrder(data, day) {
  const orders = data.rows.filter(row => dateKey(row[data.index.day]) === dateKey(day)).map(row => Number(row[data.index.order]) || 0);
  return orders.length ? Math.max(...orders) + 1 : 1;
}

function rebalanceOrders(data, day) {
  data.rows
    .map((row, index) => ({ row, index, order: Number(row[data.index.order]) || 0 }))
    .filter(value => dateKey(value.row[data.index.day]) === dateKey(day))
    .sort((a, b) => a.order - b.order || a.index - b.index)
    .forEach((value, index) => setValue(data.sheet, value.index + 2, data.index.order, index + 1));
}
