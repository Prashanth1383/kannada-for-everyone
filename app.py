"""Kannada for Everyone: Flask server.

* Content (lessons, scenes, places, districts) lives in data/*.json
* GET /            the website
* GET /data.js     content as JavaScript constants for the page
* GET /api/data    the same content as JSON
* POST /api/chat   streamed AI conversation partner (needs ANTHROPIC_API_KEY)
"""
import json
import os
import time
from collections import defaultdict, deque
from pathlib import Path

from flask import Flask, Response, jsonify, render_template, request

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

BASE = Path(__file__).parent
MODEL = os.getenv("ANTHROPIC_MODEL", "claude-haiku-5-5")
app = Flask(__name__)


def load_data():
    return {p.stem.upper(): json.loads(p.read_text(encoding="utf8"))
            for p in sorted((BASE / "data").glob("*.json"))}


DATA = load_data()
SYSTEM = (BASE / "data" / "ai_prompt.txt").read_text(encoding="utf8")

client = None
if os.getenv("ANTHROPIC_API_KEY"):
    try:
        import anthropic
        client = anthropic.Anthropic()
    except ImportError:
        print("Run: pip install anthropic   (AI partner disabled)")

HITS = defaultdict(deque)


def limited(ip, limit=20, per=60):
    q, now = HITS[ip], time.time()
    while q and now - q[0] > per:
        q.popleft()
    if len(q) >= limit:
        return True
    q.append(now)
    return False


def clean(messages):
    out = []
    for m in (messages or [])[-8:]:
        role, text = m.get("role"), str(m.get("content", ""))[:2000]
        if role in ("user", "assistant") and text.strip():
            out.append({"role": role, "content": text})
    while out and out[0]["role"] != "user":
        out.pop(0)
    return out


@app.get("/")
def home():
    return render_template("index.html")


@app.get("/data.js")
def data_js():
    js = "".join(f"const {k}={json.dumps(v, ensure_ascii=False)};\n" for k, v in DATA.items())
    return Response(js, mimetype="text/javascript")


@app.get("/api/data")
def api_data():
    return jsonify(DATA)


@app.get("/api/health")
def health():
    return jsonify(ok=True, ai=client is not None, model=MODEL,
                   districts=len(DATA["KD"]), places=len(DATA["PL"]) + len(DATA["TP"]))


@app.post("/api/chat")
def chat():
    if client is None:
        return jsonify(error="AI is not configured"), 503
    if limited(request.remote_addr or "x"):
        return jsonify(error="Too many requests"), 429
    msgs = clean((request.get_json(silent=True) or {}).get("messages"))
    if not msgs or msgs[-1]["role"] != "user":
        return jsonify(error="Bad request"), 400

    def stream():
        try:
            with client.messages.stream(model=MODEL, max_tokens=400,
                                        system=SYSTEM, messages=msgs) as s:
                yield from s.text_stream
        except Exception as e:
            print("AI error:", e)

    return Response(stream(), mimetype="text/plain")


if __name__ == "__main__":
    app.run(debug=True, port=5000)
