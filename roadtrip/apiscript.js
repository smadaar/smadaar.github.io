// For a standalone Apps Script project, paste the ID from the spreadsheet URL
// here. Leave empty only when this script is bound directly to that spreadsheet.
const ROADTRIP_SPREADSHEET_ID = "1NTkw-Ezu3J-vu5Ix_2gSeBXFExAIqQdCj3yR3UzCdqk";
const ROADTRIP_ITEM_SHEET = "Itinerary";

function roadtripSpreadsheet() {
  const spreadsheet = ROADTRIP_SPREADSHEET_ID
    ? SpreadsheetApp.openById(ROADTRIP_SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error("No active spreadsheet. Set ROADTRIP_SPREADSHEET_ID in Code.gs.");
  return spreadsheet;
}

function dateKey(value) {
  if (value instanceof Date) return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd");
  const match = String(value || "").match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : String(value || "").trim();
}

function doGet() {
  const sheet = roadtripSpreadsheet().getSheetByName(ROADTRIP_ITEM_SHEET);
  if (!sheet) throw new Error(`Missing sheet: ${ROADTRIP_ITEM_SHEET}`);
  const rows = sheet.getDataRange().getValues();
  const headers = rows.shift().map(value => String(value).trim());
  const index = Object.fromEntries(headers.map((header, position) => [header, position]));
  ["day", "type", "title"].forEach(field => {
    if (index[field] === undefined) throw new Error(`Missing \"${field}\" column in ${ROADTRIP_ITEM_SHEET}.`);
  });

  const days = new Map();
  rows.forEach(row => {
    const item = Object.fromEntries(headers.map((header, position) => [header, row[position]]));
    const date = dateKey(item.day);
    if (!date) return;
    if (!days.has(date)) days.set(date, { date, notes: "", items: [] });
    const day = days.get(date);
    const type = String(item.type || "").trim();

    // A Summary row supplies the day-level note and is not rendered as an item.
    if (type.toLowerCase() === "summary") {
      day.notes = item.notes || item.title || "";
      return;
    }
    if (!type) return;

    const obj = { type, title: item.title };
    ["id", "start", "end", "notes", "from", "to", "travelMode", "mapUrl", "directionUrl"].forEach(field => {
      if (item[field]) obj[field] = item[field];
    });
    if (item.link || item.Link) obj.link = item.link || item.Link;
    obj.order = Number(item.order) || 0;
    day.items.push(obj);
  });

  const result = {
    days: [...days.values()]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(day => ({
        date: day.date,
        ...(day.notes ? { notes: day.notes } : {}),
        items: day.items.sort((a, b) => a.order - b.order).map(({ order, ...item }) => item)
      }))
  };

  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}
