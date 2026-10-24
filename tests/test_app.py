import sys, unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
from app import app


class Tests(unittest.TestCase):
    def setUp(self):
        self.c = app.test_client()

    def test_home(self):
        r = self.c.get("/")
        self.assertEqual(r.status_code, 200)
        self.assertIn(b"Kannada", r.data)

    def test_data(self):
        js = self.c.get("/data.js").data.decode()
        for k in ("LESSONS", "KD", "PL", "TP", "SIMA"):
            self.assertIn(f"const {k}=", js)

    def test_health(self):
        self.assertEqual(self.c.get("/api/health").json["districts"], 31)

    def test_chat_without_key(self):
        r = self.c.post("/api/chat", json={"messages": [{"role": "user", "content": "hi"}]})
        self.assertIn(r.status_code, (200, 503))


if __name__ == "__main__":
    unittest.main()
