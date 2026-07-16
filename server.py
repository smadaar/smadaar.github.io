import http.server
import json
import os
import posixpath
import urllib.request
from urllib.parse import urlparse

PORT = int(os.environ.get("PORT", "3000"))
APP_SCRIPT_URL = os.environ.get(
    "ROADTRIP_API_URL",
    "  "https://script.google.com/macros/s/AKfycbwIYbLmdmhcIWZz344rvIJwm60a1i3FrN2ElT5kUGQISbFOLrIZQa72xNLhIyjFNE8F/exec";
",
)


class RoadtripHandler(http.server.SimpleHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        parsed_path = urlparse(self.path)

        if parsed_path.path == "/api/roadtrip":
            self.proxy_roadtrip()
            return

        if parsed_path.path == "/":
            self.path = "/roadtrip/index.html"

        self.path = posixpath.normpath(parsed_path.path)
        return super().do_GET()

    def proxy_roadtrip(self):
        try:
            req = urllib.request.Request(APP_SCRIPT_URL, method="GET")
            with urllib.request.urlopen(req, timeout=20) as upstream:
                body = upstream.read()
                content_type = upstream.headers.get_content_type() or "application/json"
                self.send_response(200)
                self.send_header("Content-Type", content_type)
                self.send_header("Access-Control-Allow-Origin", "*")
                self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
                self.send_header("Access-Control-Allow-Headers", "Content-Type")
                self.end_headers()
                self.wfile.write(body)
        except Exception as exc:
            payload = json.dumps({"error": "Unable to reach Google Sheet endpoint.", "details": str(exc)}).encode("utf-8")
            self.send_response(502)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(payload)


if __name__ == "__main__":
    os.chdir(os.path.dirname(__file__))
    httpd = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), RoadtripHandler)
    print(f"Roadtrip server running at http://127.0.0.1:{PORT}")
    httpd.serve_forever()
