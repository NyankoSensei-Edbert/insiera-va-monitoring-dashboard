"""
INSIERA-VA Monitoring — Python Flask Proxy
------------------------------------------
Serves the built React app and proxies /api/* to the real backend.

Usage (local):
    pip install flask requests
    python server.py

Usage (Docker):
    docker compose up

Environment variables:
    BACKEND_URL   — target backend  (default: https://localhost:8883)
    VERIFY_SSL    — 'true' / 'false' (default: false — allows self-signed certs)
    PORT          — local listen port (default: 5050)
"""

import os
import json
import requests
from dotenv import load_dotenv

from flask import Flask, request, Response, send_from_directory

load_dotenv()

app = Flask(__name__, static_folder="dist")

BACKEND_URL = os.environ.get("BACKEND_URL", "https://localhost:8883").rstrip("/")
VERIFY_SSL  = os.environ.get("VERIFY_SSL", "false").lower() == "true"
PORT        = int(os.environ.get("PORT", 5050))

# Headers that must not be forwarded
HOP_BY_HOP = {"host", "content-length", "transfer-encoding", "connection",
               "keep-alive", "proxy-authenticate", "proxy-authorization",
               "te", "trailers", "upgrade"}


@app.route("/api/<path:path>", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
def proxy(path):
    target = f"{BACKEND_URL}/{path}"
    qs = request.query_string.decode()
    if qs:
        target = f"{target}?{qs}"

    headers = {k: v for k, v in request.headers if k.lower() not in HOP_BY_HOP}

    try:
        resp = requests.request(
            method=request.method,
            url=target,
            headers=headers,
            data=request.get_data(),
            verify=VERIFY_SSL,
            timeout=30,
            allow_redirects=False,
        )
    except requests.exceptions.SSLError as e:
        return Response(json.dumps({"error": f"SSL error: {e}"}), 502, content_type="application/json")
    except requests.exceptions.ConnectionError as e:
        return Response(json.dumps({"error": f"Cannot connect to {BACKEND_URL}: {e}"}), 502, content_type="application/json")
    except requests.exceptions.Timeout:
        return Response(json.dumps({"error": "Backend timed out"}), 504, content_type="application/json")

    excluded = HOP_BY_HOP | {"content-encoding"}
    out_headers = {k: v for k, v in resp.headers.items() if k.lower() not in excluded}
    return Response(resp.content, status=resp.status_code, headers=out_headers)


# Serve React app — all non-API routes return index.html (SPA routing)
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")


if __name__ == "__main__":
    print(f"""
┌─────────────────────────────────────────────────────┐
│      INSIERA-VA Monitoring Proxy  (Flask)           │
├─────────────────────────────────────────────────────┤
│  Dashboard  →  http://localhost:{PORT:<5}               │
│  Backend    →  {BACKEND_URL:<37}│
│  SSL verify →  {str(VERIFY_SSL):<37}│
└─────────────────────────────────────────────────────┘
""")
    app.run(host="0.0.0.0", port=PORT, debug=False)
