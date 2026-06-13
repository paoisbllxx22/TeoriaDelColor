"""
Servidor HTTP con cabeceras de seguridad para Color Lab.
Uso: python server.py
"""
import http.server
import socketserver
import os

PORT = 5500
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

CSP = (
    "default-src 'none'; "
    "script-src 'self'; "
    "style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; "
    "font-src https://fonts.gstatic.com; "
    "img-src 'self' data:; "
    "connect-src https://fonts.googleapis.com https://fonts.gstatic.com; "
    "object-src 'none'; "
    "base-uri 'self'; "
    "frame-ancestors 'none';"
)


class SecureHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header("Content-Security-Policy", CSP)
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header(
            "Permissions-Policy",
            "camera=(), microphone=(), geolocation=(), payment=()"
        )
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Resource-Policy", "same-origin")
        super().end_headers()

    def log_message(self, fmt, *args):
        pass


with socketserver.TCPServer(("", PORT), SecureHandler) as httpd:
    print(f"Color Lab -> http://localhost:{PORT}")
    httpd.serve_forever()
