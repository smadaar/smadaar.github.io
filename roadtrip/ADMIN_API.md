# Road trip admin API

`admin.html` is a separate editor for the `Itinerary` item sheet. It requires its own Google Apps Script Web App deployment because the existing public `doGet` API deliberately exposes only the grouped display data.

## Sheet columns

The admin script expects these headers (case-sensitive):

- `Itinerary DAYS`: `id`, `date`, and optionally `notes` or `Day Notes`.
- `Itinerary`: `id`, `day`, `order`, `type`, `title`, plus optional `start`, `end`, `notes`, `from`, `to`, `travelMode`, `mapUrl`, `directionUrl`, and `link`.

The admin script automatically adds an `id` column to `Itinerary` when it is first used and fills every existing item row with a UUID. New items receive one automatically too.

## Deploy

1. Create a standalone Apps Script project attached to the same spreadsheet.
2. Copy in [admin-apiscript.js](admin-apiscript.js).
3. Deploy it as a Web App and copy the `/exec` URL.
4. Open `admin.html`, paste that URL into the connection field, save it, then load items.

The page sends form-encoded POST requests for create, update, delete, and move actions, and GET requests with `?action=list` to load the data.

## Deployment access and security

Because `admin.html` is a static page on a different origin, its browser requests cannot use your Google sign-in session. For this direct setup, deploy the Web App to **execute as you** with **Who has access: Anyone** (or the equivalent external-access option in your Workspace). A restricted deployment sends Google’s HTML sign-in page to the admin portal instead of JSON.

That makes the Web App URL a credential: keep `admin.html` private, do not link it from the public itinerary, and rotate/redeploy the URL if it is exposed. For account-based access control, host the admin UI inside Apps Script or put an authenticated server-side proxy in front of the API instead.
