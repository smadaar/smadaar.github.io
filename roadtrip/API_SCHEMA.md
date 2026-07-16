# Road trip API schema

Each day returned by the Google Apps Script endpoint can now include an optional `notes` field:

```json
{
  "date": "Sun 2 Aug",
  "notes": "Arrival day — collect essentials before checking in.",
  "items": []
}
```

## Google Sheet

Add a `Day Notes` column to the sheet that provides the day-level data. Enter the note once for the day (or only on that day's first item if the script groups item rows into days).

## Google Apps Script

When building each day object, read the new column and assign it as `notes`. For a row-based itinerary, only set it when the day is first created so repeated item rows do not overwrite it:

```javascript
if (!daysByDate[date]) {
  daysByDate[date] = { date, notes: row[dayNotesColumn] || "", items: [] };
}
```

The public endpoint should then return `Object.values(daysByDate)` as it does today. No proxy-server changes are needed because it already passes the JSON through unchanged.

## Item links

Each itinerary item can also include an optional `link` field, separate from `mapUrl` and `directionUrl`. Add a `Link` column to the item sheet and return it with the item object:

```json
{
  "type": "Activity",
  "title": "Land",
  "link": "https://example.com/booking"
}
```

The planner displays this as a `Link` next to any Map or Directions link.
