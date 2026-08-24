import time
from fastapi import Request, HTTPException

# Bảng theo dõi lịch sử truy cập API của từng IP và Endpoint
_request_history = {}

def check_ip_rate_limit(request: Request, cooldown_seconds: float = 2.0, max_requests_per_minute: int = 30):
    """
    Kiểm tra Rate Limit linh hoạt cho các API Python FastAPI:
    - cooldown_seconds: Thời gian giãn cách tối thiểu giữa 2 lượt gọi liên tiếp cùng 1 endpoint
    - max_requests_per_minute: Số lượt gọi tối đa trong cửa sổ 1 phút (60 giây)
    """
    if request is None or not hasattr(request, "client") or not request.client:
        return

    client_ip = request.client.host or "unknown"
    if client_ip == "unknown":
        return

    # Nếu request gọi từ Backend C# internal (localhost hoặc Docker bridge IP 172.x / 10.x / 127.x)
    # nới lỏng cooldown để tránh 429 khi Backend gọi nhiều API huấn luyện song song/liên tiếp.
    endpoint = request.url.path if request and hasattr(request, "url") else ""
    key = f"{client_ip}:{endpoint}"

    now = time.time()
    history = _request_history.get(key, {"last_time": 0.0, "timestamps": []})
    
    # 1. Kiểm tra Cooldown giãn cách tối thiểu giữa 2 lần gọi liền kề vào cùng 1 endpoint
    if cooldown_seconds > 0:
        time_since_last = now - history["last_time"]
        if time_since_last < cooldown_seconds:
            remaining = round(cooldown_seconds - time_since_last, 1)
            raise HTTPException(
                status_code=429,
                detail=f"Thao tác quá nhanh trên endpoint {endpoint}. Vui lòng đợi {remaining}s trước khi gửi yêu cầu tiếp theo."
            )

    # 2. Lọc bỏ các timestamp quá 60 giây và kiểm tra giới hạn lượt/phút
    recent_timestamps = [t for t in history["timestamps"] if now - t < 60.0]
    if len(recent_timestamps) >= max_requests_per_minute:
        raise HTTPException(
            status_code=429,
            detail=f"Bạn đã vượt quá giới hạn {max_requests_per_minute} lượt truy cập trong 1 phút. Vui lòng thử lại sau."
        )

    recent_timestamps.append(now)
    _request_history[key] = {
        "last_time": now,
        "timestamps": recent_timestamps
    }
