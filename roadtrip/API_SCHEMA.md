# Road trip API schema

The itinerary uses one Google Sheet named `Itinerary`. Its required headers are
`day`, `type`, and `title`; `order` and the usual item fields are optional.

`day` is the calendar date for the row (for example `2026-08-02`), not a
numeric reference to another sheet. The public Apps Script groups rows by this
date and returns the existing display format:

```json
{
  "date": "2026-08-02",
  "notes": "Arrival day — collect essentials before checking in.",
  "items": []
}
```

## Day summaries

Add one row with `type` set to `Summary` for a day. Its `notes` value becomes
the day-level note in the response and the row itself is not displayed as an
itinerary item. If `notes` is blank, its `title` is used as the summary text.

## Item links

Items can include an optional `link` field, separate from `mapUrl` and
`directionUrl`. The planner displays it as a `Link` next to any Map or
Directions link.
