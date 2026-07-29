# Road trip admin API

`admin.html` is an editor for the single `Itinerary` sheet. It requires its
own Google Apps Script Web App deployment because the public endpoint exposes
only grouped display data.

## Sheet columns

The admin script requires these case-sensitive headers in `Itinerary`:

- `id`, `day`, `order`, `type`, and `title`.
- Optional item headers: `start`, `end`, `notes`, `from`, `to`, `travelMode`,
  `mapUrl`, `directionUrl`, and `link`.

`day` must contain the date for the row. Use a `Summary` type row to provide a
day note: its `notes` value (or its `title` when notes is blank) appears above
that day in the itinerary. The admin script adds and fills an `id` column when
it is first used.

## Deploy

1. Create a standalone Apps Script project attached to the same spreadsheet.
2. Copy in [admin-apiscript.js](admin-apiscript.js) and set
   `ADMIN_SPREADSHEET_ID` if needed.
3. Deploy it as a Web App and copy the `/exec` URL.
4. Open `admin.html`, paste that URL into the connection field, save it, then
   load items.

The page sends form-encoded POST requests for create, update, delete, and move
actions, and GET requests with `?action=list` to load data.
