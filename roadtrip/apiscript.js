function doGet() {

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const daySheet = ss.getSheetByName("Itinerary DAYS");
  const itemSheet = ss.getSheetByName("Itinerary");

  const dayRows = daySheet.getDataRange().getValues();
  const itemRows = itemSheet.getDataRange().getValues();

  const dayHeaders = dayRows.shift();
  const itemHeaders = itemRows.shift();

  const days = dayRows.map(row => {

    const day = {};

    dayHeaders.forEach((header, i) => {
      day[header] = row[i];
    });

    // Supports both the existing machine-friendly header and the sheet label.
    if (!day.notes && day["Day Notes"]) {
      day.notes = day["Day Notes"];
    }

    return day;

  });

  const items = itemRows.map(row => {

    const item = {};

    itemHeaders.forEach((header, i) => {
      item[header] = row[i];
    });

    // Supports either `link` or the more readable `Link` column header.
    if (!item.link && item.Link) {
      item.link = item.Link;
    }

    return item;

  });

  const result = {

    days: days.map(day => ({

      date: day.date,

      ...(day.notes ? { notes: day.notes } : {}),

      items: items
        .filter(item => Number(item.day) === Number(day.id))
        .sort((a, b) => Number(a.order) - Number(b.order))
        .map(item => {

          const obj = {
            type: item.type,
            title: item.title
          };

          if (item.start) obj.start = item.start;
          if (item.end) obj.end = item.end;
          if (item.notes) obj.notes = item.notes;
          if (item.from) obj.from = item.from;
          if (item.to) obj.to = item.to;
          if (item.travelMode) obj.travelMode = item.travelMode;
          if (item.mapUrl) obj.mapUrl = item.mapUrl;
          if (item.directionUrl) obj.directionUrl = item.directionUrl;
          if (item.link) obj.link = item.link;

          return obj;

        })

    }))

  };

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);

}
