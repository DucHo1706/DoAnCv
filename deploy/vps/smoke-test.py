#!/usr/bin/env python3
"""Kiểm thử production chỉ đọc; thông tin đăng nhập lấy từ biến môi trường."""

import json
import os
import sys
import urllib.error
import urllib.request

BASE_URL = os.getenv("PUBLIC_URL", "https://recruitinsightai.com").rstrip("/")


def request(path, method="GET", body=None, token=None):
    data = json.dumps(body).encode("utf-8") if body is not None else None
    headers = {"Accept": "application/json"}
    if data is not None:
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(BASE_URL + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            raw = response.read().decode("utf-8")
            return response.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8")
        try:
            payload = json.loads(raw) if raw else None
        except json.JSONDecodeError:
            payload = raw
        return exc.code, payload


def login(prefix):
    email = os.getenv(f"{prefix}_EMAIL")
    password = os.getenv(f"{prefix}_PASSWORD")
    if not email or not password:
        raise RuntimeError(f"Thiếu {prefix}_EMAIL hoặc {prefix}_PASSWORD")
    status, payload = request("/api/auth/login", "POST", {"email": email, "password": password})
    assert status == 200 and payload.get("token"), f"Đăng nhập {prefix} thất bại: HTTP {status}"
    return payload["token"]


def expect(name, path, expected, token=None):
    status, _ = request(path, token=token)
    if status not in expected:
        raise AssertionError(f"{name}: HTTP {status}, cần một trong {sorted(expected)}")
    print(f"ĐẠT  {name}: HTTP {status}")


def main():
    expect("Trang sức khỏe", "/health", {200})
    expect("Việc làm công khai", "/api/jobs/published?pageIndex=1&pageSize=1", {200})
    protected = [
        ("Xuất dữ liệu CV", "/api/aitraining/export-cv-data"),
        ("Dashboard Admin", "/api/dashboard/admin-stats"),
        ("Dữ liệu mô phỏng", "/api/dashboard/simulator-candidates"),
        ("Cài đặt hệ thống", "/api/systemsettings"),
        ("Toàn bộ việc làm", "/api/jobs"),
    ]
    for name, path in protected:
        expect(f"Ẩn danh bị chặn — {name}", path, {401})

    admin = login("ADMIN")
    recruiter = login("RECRUITER")
    candidate = login("CANDIDATE")
    expect("Admin xem dashboard", "/api/dashboard/admin-stats", {200}, admin)
    expect("HR không xem dashboard Admin", "/api/dashboard/admin-stats", {403}, recruiter)
    expect("Ứng viên không xuất dữ liệu CV", "/api/aitraining/export-cv-data", {403}, candidate)
    expect("HR xem dashboard HR", "/api/dashboard/hr-stats", {200}, recruiter)
    print("Hoàn tất smoke test chỉ đọc.")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"THẤT BẠI: {exc}", file=sys.stderr)
        raise SystemExit(1)
