# Chạy 9Router trên VPS Ubuntu

9Router là dịch vụ dự phòng cho lớp LLM của Python, không phải thành phần dùng để chứng minh độ chính xác trong khóa luận. Luồng runtime vẫn là `9Router -> Gemini trực tiếp -> fallback cục bộ có gắn trạng thái`.

## Nguyên tắc an toàn

- Chạy bằng Docker Compose profile `llm-router`; không chạy tiến trình ứng dụng thường trực bằng tài khoản `root` của Ubuntu.
- Image chính thức khởi động entrypoint để sửa quyền volume rồi hạ xuống user `node`. Docker daemon vẫn cần `sudo` hoặc quyền thuộc nhóm `docker` khi cài đặt/vận hành container.
- Port `20128` chỉ map vào `127.0.0.1` của VPS. Không mở port này trên firewall và không proxy công khai dashboard.
- Truy cập dashboard bằng SSH tunnel từ máy cá nhân: `ssh -L 20128:127.0.0.1:20128 <user>@<vps-ip>`, sau đó mở `http://127.0.0.1:20128`.
- Bật `REQUIRE_API_KEY=true`. Secret và API key chỉ đặt trong `/opt/recruitment/app/.env` với quyền tệp `600`, không ghi vào Git hoặc log.

## Biến môi trường cần cấu hình

Sinh riêng từng secret trên VPS bằng `openssl rand -hex 32`, sau đó điền vào `.env`:

```dotenv
ENABLE_9ROUTER=true
NINE_ROUTER_IMAGE=decolua/9router:latest
NINE_ROUTER_JWT_SECRET=[REDACTED]
NINE_ROUTER_API_KEY_SECRET=[REDACTED]
NINE_ROUTER_MACHINE_ID_SALT=[REDACTED]
NINE_ROUTER_INITIAL_PASSWORD=[REDACTED]

LLM_ROUTER_BASE_URL=http://9router:20128/v1
LLM_ROUTER_API_KEY=[REDACTED]
LLM_ROUTER_MODELS=Gemini,deepseek,ag/gemini-3.5-flash-low
LLM_ROUTER_TIMEOUT_SECONDS=25
```

`LLM_ROUTER_API_KEY` là key do dashboard 9Router tạo cho Python, không phải `NINE_ROUTER_API_KEY_SECRET`.

## Khởi động và kiểm tra

```bash
cd /opt/recruitment/app
chmod 600 .env
docker compose --profile llm-router config --quiet
docker compose --profile llm-router pull 9router
docker compose --profile llm-router up -d 9router ai-service
docker compose --profile llm-router ps
curl --fail --silent http://127.0.0.1:20128/dashboard >/dev/null
docker compose logs --tail=100 9router ai-service
```

Sau khi tạo API key trong dashboard, cập nhật `LLM_ROUTER_API_KEY` trong `.env` và chạy lại `docker compose --profile llm-router up -d ai-service`.

## Chuyển dữ liệu local

Không copy khi 9Router đang ghi SQLite. Dừng 9Router local, sao lưu thư mục dữ liệu chứa `db/data.sqlite`, rồi chuyển gói sao lưu lên VPS. Trước khi phục hồi, tạo bản sao volume hiện tại. Chỉ phục hồi khi phiên bản image trên VPS tương thích với phiên bản local; nếu không rõ, cấu hình lại provider/account qua dashboard an toàn hơn việc chép SQLite.

Sau khi chép dữ liệu vào volume `recruitment_nine_router_data`, bảo đảm file thuộc UID/GID mà image sử dụng rồi khởi động lại. Không đưa gói sao lưu, OAuth token hoặc SQLite vào repository.

## Rollback

```bash
cd /opt/recruitment/app
docker compose --profile llm-router stop 9router
```

Xóa hoặc để trống `LLM_ROUTER_BASE_URL`, sau đó khởi động lại `ai-service`. Python sẽ quay về Gemini trực tiếp và fallback cục bộ; dữ liệu volume 9Router vẫn được giữ để phục hồi sau.
