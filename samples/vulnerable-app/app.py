"""
Sample vulnerable application for Vibe Shield AI security testing.
Contains intentional security flaws across multiple OWASP categories:
- A01: Broken Access Control / Path Traversal
- A02: Cryptographic Failures (Hardcoded credentials & weak MD5 hashing)
- A03: Injection (SQL Injection, Command Injection)
- A08: Software and Data Integrity Failures (Insecure Deserialization via pickle)
"""

import os
import sqlite3
import subprocess
import hashlib
import pickle
from flask import Flask, request, jsonify

app = Flask(__name__)

# CWE-798: Use of Hard-coded Credentials / Secrets
SECRET_KEY = "AKIAIOSFODNN7EXAMPLE_VIBE_SHIELD_DEMO_SECRET_KEY"
JWT_SECRET = "super_insecure_jwt_secret_token_12345"
DATABASE_PASSWORD = "production_admin_password_do_not_share!"

DB_FILE = "sample.db"


def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, password TEXT, role TEXT)")
    c.execute("INSERT OR IGNORE INTO users VALUES (1, 'admin', '5f4dcc3b5aa765d61d8327deb882cf99', 'admin')")
    conn.commit()
    conn.close()


@app.route("/api/login", methods=["POST"])
def login():
    """
    CWE-89: SQL Injection Vulnerability
    Using direct string formatting instead of parameterized query.
    """
    data = request.get_json() or {}
    username = data.get("username", "")
    password = data.get("password", "")

    # CWE-328: Use of Weak Hash (MD5)
    pw_hash = hashlib.md5(password.encode()).hexdigest()

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    # VULNERABLE: Direct SQL Injection
    raw_query = f"SELECT * FROM users WHERE username = '{username}' AND password = '{pw_hash}'"
    cursor.execute(raw_query)
    user = cursor.fetchone()
    conn.close()

    if user:
        return jsonify({"status": "success", "user": user[1], "role": user[3]})
    return jsonify({"status": "failed", "error": "Invalid credentials"}), 401


@app.route("/api/ping", methods=["GET"])
def ping_host():
    """
    CWE-78: OS Command Injection
    Passing unvalidated user input directly to system shell.
    """
    host = request.args.get("host", "127.0.0.1")

    # VULNERABLE: Shell execution with unescaped user parameter
    cmd = f"ping -c 1 {host}"
    output = subprocess.check_output(cmd, shell=True)
    return jsonify({"output": output.decode("utf-8", errors="ignore")})


@app.route("/api/load_session", methods=["POST"])
def load_session():
    """
    CWE-502: Deserialization of Untrusted Data
    Using Python pickle to deserialize arbitrary client payload.
    """
    session_data = request.data
    # VULNERABLE: Insecure deserialization can execute arbitrary code
    obj = pickle.loads(session_data)
    return jsonify({"session": str(obj)})


@app.route("/api/view_log", methods=["GET"])
def view_log():
    """
    CWE-22: Path Traversal
    Accessing filesystem without sanitizing the relative path.
    """
    log_name = request.args.get("file", "app.log")
    # VULNERABLE: Allows path traversal e.g. ../../etc/passwd
    log_path = os.path.join("/var/log", log_name)
    if os.path.exists(log_path):
        with open(log_path, "r") as f:
            return f.read()
    return jsonify({"error": "File not found"}), 404


if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5000, debug=True)
