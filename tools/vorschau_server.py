"""Lokale Vorschau der Homepage mit Spulen in Videos.

Aufruf im Hauptordner:  python tools/vorschau_server.py [port]      (Standard: 8000)
dann http://localhost:8000 öffnen.

Warum nicht einfach `python -m http.server`? Der kann keine Teilanfragen (HTTP „Range“).
Browser brauchen die aber, um in einem Video vor- und zurückzuspulen – mit dem einfachen
Server springt das Video immer wieder an den Anfang. GitHub Pages kann das von sich aus.
"""
import os
import re
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class Handler(SimpleHTTPRequestHandler):
    def send_head(self):
        bereich = self.headers.get("Range")
        pfad = self.translate_path(self.path)
        if not bereich or not os.path.isfile(pfad):
            return super().send_head()
        m = re.match(r"bytes=(\d*)-(\d*)$", bereich.strip())
        groesse = os.path.getsize(pfad)
        if not m or (m.group(1) == "" and m.group(2) == ""):
            return super().send_head()
        if m.group(1) == "":                      # die letzten n Bytes
            start, ende = max(0, groesse - int(m.group(2))), groesse - 1
        else:
            start = int(m.group(1))
            ende = min(int(m.group(2)), groesse - 1) if m.group(2) else groesse - 1
        if start >= groesse or start > ende:
            self.send_error(416, "Bereich ungültig")
            return None
        f = open(pfad, "rb")
        f.seek(start)
        self.rest = ende - start + 1
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(pfad))
        self.send_header("Content-Range", f"bytes {start}-{ende}/{groesse}")
        self.send_header("Content-Length", str(self.rest))
        self.send_header("Accept-Ranges", "bytes")
        self.end_headers()
        return f

    def copyfile(self, quelle, ziel):
        rest = getattr(self, "rest", None)
        if rest is None:
            return super().copyfile(quelle, ziel)
        while rest > 0:
            stueck = quelle.read(min(65536, rest))
            if not stueck:
                break
            ziel.write(stueck)
            rest -= len(stueck)

    def end_headers(self):
        if not hasattr(self, "rest"):
            self.send_header("Accept-Ranges", "bytes")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
    print(f"Vorschau: http://localhost:{port}  (Beenden mit Strg+C)")
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
