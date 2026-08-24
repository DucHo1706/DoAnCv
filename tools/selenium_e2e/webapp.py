from __future__ import annotations

import json
import re
import time
from pathlib import Path
from typing import Any
from urllib.parse import quote, urlparse

from .config import E2EConfig
from .job_fixtures import JobFixture


MODAL_PANEL_SELECTOR = ".ant-modal-container, .ant-modal-content"
ACTIVE_MODAL_PANEL_SELECTOR = (
    ".ant-modal-wrap:not([style*='display: none']) .ant-modal-container, "
    ".ant-modal-wrap:not([style*='display: none']) .ant-modal-content"
)
ACTIVE_MODAL_FILE_INPUT_SELECTOR = (
    ".ant-modal-wrap:not([style*='display: none']) .ant-modal-container input[type='file'], "
    ".ant-modal-wrap:not([style*='display: none']) .ant-modal-content input[type='file']"
)


class RecruitInsightBrowser:
    def __init__(self, config: E2EConfig) -> None:
        self.config = config
        self.driver: Any = None

    def start(self) -> None:
        try:
            from selenium import webdriver
        except ImportError as error:
            raise RuntimeError(
                "Chưa cài Selenium. Chạy pip install -r tools/selenium_e2e/requirements.txt."
            ) from error

        if self.config.browser == "edge":
            from selenium.webdriver.edge.service import Service as EdgeService

            options = webdriver.EdgeOptions()
            options.set_capability("ms:loggingPrefs", {"browser": "ALL", "performance": "ALL"})
            if self.config.headless:
                options.add_argument("--headless=new")
            if self.config.ignore_certificate_errors:
                options.add_argument("--ignore-certificate-errors")
            options.add_argument("--window-size=1440,1000")
            options.add_argument("--disable-gpu")
            options.add_argument("--no-sandbox")
            options.add_argument("--disable-dev-shm-usage")
            service = EdgeService(executable_path=str(self.config.driver_path)) if self.config.driver_path else None
            self.driver = webdriver.Edge(service=service, options=options)
        else:
            from selenium.webdriver.chrome.service import Service as ChromeService

            options = webdriver.ChromeOptions()
            options.set_capability("goog:loggingPrefs", {"browser": "ALL", "performance": "ALL"})
            if self.config.headless:
                options.add_argument("--headless=new")
            if self.config.ignore_certificate_errors:
                options.add_argument("--ignore-certificate-errors")
            options.add_argument("--window-size=1440,1000")
            options.add_argument("--disable-gpu")
            options.add_argument("--no-sandbox")
            options.add_argument("--disable-dev-shm-usage")
            service = ChromeService(executable_path=str(self.config.driver_path)) if self.config.driver_path else None
            self.driver = webdriver.Chrome(service=service, options=options)

        self.driver.set_page_load_timeout(self.config.page_load_seconds)
        # Audit tải cả chi tiết tiêu chí của chiến dịch; dữ liệu lớn có thể lâu hơn
        # thời gian chờ DOM thông thường nhưng vẫn phải có giới hạn rõ ràng.
        self.driver.set_script_timeout(max(self.config.page_load_seconds, 120))

    def close(self) -> None:
        if self.driver is not None:
            try:
                self.driver.quit()
            finally:
                self.driver = None

    def _wait(self, seconds: int | None = None):
        from selenium.webdriver.support.ui import WebDriverWait

        return WebDriverWait(self.driver, seconds or self.config.timeout_seconds)

    def _visible(self, locator: tuple[str, str], seconds: int | None = None):
        from selenium.webdriver.support import expected_conditions as ec

        return self._wait(seconds).until(ec.visibility_of_element_located(locator))

    def _clickable(self, locator: tuple[str, str], seconds: int | None = None):
        from selenium.webdriver.support import expected_conditions as ec

        return self._wait(seconds).until(ec.element_to_be_clickable(locator))

    def _present(self, locator: tuple[str, str], seconds: int | None = None):
        from selenium.webdriver.support import expected_conditions as ec

        return self._wait(seconds).until(ec.presence_of_element_located(locator))

    def _click_text(self, text: str, tag: str = "*") -> None:
        from selenium.webdriver.common.by import By

        xpath = f"//{tag}[normalize-space(.)={json.dumps(text, ensure_ascii=False)}]"
        element = self._clickable((By.XPATH, xpath))
        self.driver.execute_script("arguments[0].scrollIntoView({block:'center'});", element)
        element.click()

    def open(self, path: str = "/") -> None:
        from selenium.webdriver.common.by import By

        self.driver.get(f"{self.config.base_url}{path}")
        self._visible((By.TAG_NAME, "body"))
        self.assert_healthy_page()

    def assert_healthy_page(self) -> None:
        from selenium.webdriver.common.by import By

        def has_rendered_content(driver: Any) -> bool:
            body_text = driver.find_element(By.TAG_NAME, "body").text.strip()
            skeleton_count = int(
                driver.execute_script("return document.querySelectorAll('.ant-skeleton').length;") or 0
            )
            return len(body_text) >= 8 and skeleton_count == 0

        try:
            self._wait().until(has_rendered_content)
        except Exception as error:
            body = self.driver.find_element(By.TAG_NAME, "body").text.strip()
            skeleton_count = int(
                self.driver.execute_script("return document.querySelectorAll('.ant-skeleton').length;") or 0
            )
            if skeleton_count > 0:
                raise AssertionError(
                    f"Trang tải quá thời gian và còn {skeleton_count} khối chờ dữ liệu. URL: {self.driver.current_url}"
                ) from error
            raise AssertionError(
                f"Trang gần như trống, không có đủ nội dung hiển thị. URL: {self.driver.current_url}"
            ) from error

        body = self.driver.find_element(By.TAG_NAME, "body").text.strip()
        lowered = body.lower()
        fatal_markers = ["chunkloaderror", "failed to fetch dynamically imported module"]
        for marker in fatal_markers:
            if marker in lowered:
                raise AssertionError(f"Trang có lỗi frontend: {marker}")

    def screenshot(self, name: str) -> Path | None:
        if self.driver is None:
            return None
        target = self.config.run_dir / "screenshots" / f"{name}.png"
        target.parent.mkdir(parents=True, exist_ok=True)
        self.driver.save_screenshot(str(target))
        return target

    def clear_session(self) -> None:
        if self.driver is None:
            return
        self.driver.get(self.config.base_url)
        self.driver.delete_all_cookies()
        self.driver.execute_script("window.localStorage.clear(); window.sessionStorage.clear();")

    def login(self, email: str, password: str) -> None:
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support import expected_conditions as ec

        self.open("/login")
        self._visible((By.ID, "email")).send_keys(email)
        self.driver.find_element(By.ID, "password").send_keys(password)
        self._click_text("Đăng nhập", "button")
        self._wait().until(lambda driver: "/login" not in driver.current_url)
        self._wait().until(ec.presence_of_element_located((By.TAG_NAME, "body")))
        self.assert_healthy_page()

    def audit_portal_route(
        self,
        path: str,
        viewport_name: str,
        width: int,
        height: int,
        reload_route: bool = True,
    ) -> dict[str, Any]:
        """Mở một route theo viewport thật và phát hiện lỗi render/tràn ngang cấp trang."""
        from selenium.webdriver.common.by import By

        self.driver.set_window_size(width, height)
        started = time.perf_counter()
        if reload_route:
            # Điều hướng qua History API giống React Router khi người dùng bấm menu.
            # driver.get() sẽ reload toàn bộ MainLayout, tạo request notification/hub
            # không có trong luồng SPA thật và có thể tự chạm rate limit khi audit.
            self.driver.execute_script(
                """
                const target = arguments[0];
                if (window.location.pathname !== target) {
                  window.history.pushState({}, '', target);
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }
                """,
                path,
            )
            self._wait().until(
                lambda driver: driver.execute_script("return window.location.pathname") == path
            )
            self.assert_healthy_page()
        elif path not in self.driver.current_url:
            raise AssertionError(
                f"Không thể kiểm tra responsive cho {path}: trình duyệt đang ở {self.driver.current_url}."
            )
        # Chờ một nhịp ngắn để layout AntD ổn định sau breakpoint và request dữ liệu.
        time.sleep(0.35)

        metrics = self.driver.execute_script(
            """
            const root = document.documentElement;
            const body = document.body;
            const viewport = window.innerWidth;
            const visible = element => {
              const style = window.getComputedStyle(element);
              const rect = element.getBoundingClientRect();
              return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
            };
            const offenders = [...document.querySelectorAll('main, header, .ant-layout, .ant-card, .ant-row, .ant-modal-content')]
              .filter(visible)
              .map(element => {
                const rect = element.getBoundingClientRect();
                return {
                  selector: element.id ? `#${element.id}` : String(element.className || element.tagName).slice(0, 120),
                  left: Math.round(rect.left),
                  right: Math.round(rect.right),
                  width: Math.round(rect.width),
                };
              })
              .filter(item => item.left < -4 || item.right > viewport + 4)
              .slice(0, 8);
            return {
              viewportWidth: viewport,
              viewportHeight: window.innerHeight,
              documentWidth: Math.max(root.scrollWidth, body.scrollWidth),
              clientWidth: root.clientWidth,
              offenders,
            };
            """
        )
        body_text = self.driver.find_element(By.TAG_NAME, "body").text.strip()
        error_alerts = [
            item.text.strip()
            for item in self.driver.find_elements(By.CSS_SELECTOR, ".ant-alert-error")
            if item.is_displayed() and item.text.strip()
        ]
        overflow_px = max(0, int(metrics["documentWidth"]) - int(metrics["clientWidth"]))
        result = {
            "path": path,
            "current_url": self.driver.current_url,
            "viewport": viewport_name,
            "width": width,
            "height": height,
            "load_ms": int((time.perf_counter() - started) * 1000),
            "horizontal_overflow_px": overflow_px,
            "offenders": metrics["offenders"],
            "error_alerts": error_alerts[:3],
            "body_text_length": len(body_text),
        }
        if overflow_px > 4:
            raise AssertionError(
                f"Route {path} bị tràn ngang {overflow_px}px ở viewport {viewport_name} ({width}px). "
                f"Phần tử nghi vấn: {metrics['offenders']}"
            )
        if error_alerts:
            raise AssertionError(
                f"Route {path} hiển thị cảnh báo lỗi ở viewport {viewport_name}: {error_alerts[0]}"
            )
        return result

    def register_candidate(self, full_name: str, email: str, password: str) -> str:
        from selenium.webdriver.common.by import By
        from selenium.webdriver.common.keys import Keys

        self.clear_session()
        self.open("/register")
        fields = {
            "fullName": full_name,
            "email": email,
            "password": password,
            "confirmPassword": password,
        }
        for field_id, value in fields.items():
            element = self._visible((By.ID, field_id))
            element.send_keys(Keys.CONTROL, "a")
            element.send_keys(value)
        self._click_text("Đăng ký", "button")
        try:
            def registration_outcome(driver: Any) -> str | bool:
                if "/login" in driver.current_url:
                    return "registered"
                notices = driver.find_elements(By.CSS_SELECTOR, ".ant-message-notice-content")
                messages = [item.text.strip() for item in notices if item.is_displayed() and item.text.strip()]
                return messages[-1] if messages else False

            outcome = self._wait(max(12, self.config.timeout_seconds)).until(registration_outcome)
            if outcome == "registered":
                return "registered"
            lowered = str(outcome).casefold()
            if "tồn tại" in lowered or "được sử dụng" in lowered or "already" in lowered:
                return "exists"
            raise AssertionError(f"Đăng ký thất bại: {outcome}")
        except AssertionError:
            raise
        except Exception as error:
            raise AssertionError("Đăng ký không có phản hồi rõ ràng trong thời gian chờ.") from error

    def _open_target_job(self, job_id: str, job_title: str) -> None:
        from selenium.webdriver.common.by import By

        if job_id:
            self.open(f"/jobs/{quote(job_id)}")
            self._wait().until(
                lambda driver: "Đang tải chi tiết công việc" not in driver.find_element(By.TAG_NAME, "body").text
            )
            self.assert_healthy_page()
            return
        self.open("/jobs")
        search = self._visible((By.CSS_SELECTOR, 'input[placeholder^="Nhập tên công việc"]'))
        search.clear()
        search.send_keys(job_title)
        self._click_text("Tìm kiếm", "button")
        card_xpath = (
            "//*[contains(@class,'ant-card')][.//*[contains(normalize-space(.),"
            f"{json.dumps(job_title, ensure_ascii=False)})]]"
        )
        card = self._visible((By.XPATH, card_xpath))
        details = card.find_elements(By.XPATH, ".//button[normalize-space(.)='Xem chi tiết']")
        if not details:
            raise AssertionError(f"Không tìm thấy tin đang tuyển có tiêu đề chứa: {job_title}")
        details[0].click()
        self._wait().until(
            lambda driver: len(
                [part for part in urlparse(driver.current_url).path.split("/") if part]
            ) == 2
            and urlparse(driver.current_url).path.rstrip("/").startswith("/jobs/")
        )
        self._visible(
            (By.XPATH, "//*[normalize-space(.)='Chi tiết tin tuyển dụng']")
        )

    def public_job_titles(self, limit: int = 20) -> list[str]:
        from selenium.webdriver.common.by import By

        self.open("/jobs")
        self._wait().until(
            lambda driver: len(driver.find_elements(By.XPATH, "//h4[normalize-space(.)!='']")) > 0
            or "Không tìm thấy" in driver.find_element(By.TAG_NAME, "body").text
        )
        titles: list[str] = []
        for heading in self.driver.find_elements(
            By.XPATH,
            "//h4[normalize-space(.)!='' and ancestor::*[contains(@class,'ant-card')][.//button[normalize-space(.)='Xem chi tiết']]]",
        ):
            title = heading.text.strip()
            if title and title not in titles:
                titles.append(title)
            if len(titles) >= limit:
                break
        return titles

    def assert_target_job_available(self, job_id: str, job_title: str) -> str:
        from selenium.webdriver.common.by import By

        self._open_target_job(job_id, job_title)
        self._clickable((By.XPATH, "//button[normalize-space(.)='Ứng tuyển ngay']"))
        return self.driver.current_url

    def apply_to_job(self, cv_path: Path, job_id: str, job_title: str) -> str:
        from selenium.webdriver.common.by import By

        self._open_target_job(job_id, job_title)
        apply_xpath = "//button[normalize-space(.)='Ứng tuyển ngay']"
        apply_buttons = self.driver.find_elements(By.XPATH, apply_xpath)
        if not apply_buttons:
            body = self.driver.find_element(By.TAG_NAME, "body").text
            if "Quản lý hồ sơ đã nộp" in body:
                return "exists"
            raise AssertionError("Trang chi tiết không có nút Ứng tuyển ngay.")
        apply_button = self._clickable((By.XPATH, apply_xpath))
        self.driver.execute_script(
            "arguments[0].scrollIntoView({block:'center'});", apply_button
        )
        apply_button.click()
        try:
            modal = self._visible(
                (By.CSS_SELECTOR, ACTIVE_MODAL_PANEL_SELECTOR),
                8,
            )
        except Exception as error:
            modal_count = len(
                self.driver.find_elements(By.CSS_SELECTOR, MODAL_PANEL_SELECTOR)
            )
            token_present = bool(
                self.driver.execute_script("return Boolean(window.localStorage.getItem('token'));" )
            )
            disabled = self.driver.execute_script(
                """
                const button = [...document.querySelectorAll('button')].find(
                  item => item.textContent.trim() === 'Ứng tuyển ngay'
                );
                return button ? Boolean(button.disabled) : 'missing';
                """
            )
            raise AssertionError(
                "Bấm nút Ứng tuyển ngay nhưng modal không mở "
                f"(url={self.driver.current_url}, token={token_present}, modal={modal_count}, "
                f"disabled={disabled})."
            ) from error
        radios = modal.find_elements(By.XPATH, ".//input[@type='radio' and @value='new']")
        if radios and not radios[0].is_selected():
            self.driver.execute_script("arguments[0].click();", radios[0])
        file_input = self._present(
            (
                By.CSS_SELECTOR,
                ACTIVE_MODAL_FILE_INPUT_SELECTOR,
            )
        )
        file_input.send_keys(str(cv_path.resolve()))
        # Upload làm Modal render lại; không giữ WebElement cũ vì dễ stale khi chạy song song.
        submit = self._clickable(
            (
                By.XPATH,
                "//div[contains(@class,'ant-modal-wrap') and not(contains(@style,'display: none'))]"
                "//button[normalize-space(.)='Nộp hồ sơ']",
            )
        )
        submit.click()
        self._wait(max(self.config.timeout_seconds, self.config.submit_timeout_seconds)).until(
            lambda driver: "Hồ sơ đã được ghi nhận" in driver.find_element(By.TAG_NAME, "body").text
            or "Ứng tuyển thành công" in driver.find_element(By.TAG_NAME, "body").text
        )
        return "submitted"

    def enable_candidate_discovery(self, allow_contact: bool = True, allow_cv: bool = True) -> None:
        from selenium.webdriver.common.by import By

        self.open("/profile")
        self._click_text("Bảo mật tài khoản")
        card = self._visible(
            (By.XPATH, "//*[contains(@class,'ant-card')][.//*[contains(normalize-space(.),'Quyền riêng tư hồ sơ')]]")
        )
        switches = card.find_elements(By.CSS_SELECTOR, "button[role='switch']")
        if len(switches) < 3:
            raise AssertionError("Không tìm thấy đủ ba công tắc quyền riêng tư hồ sơ.")

        desired = [True, allow_contact, allow_cv]
        for switch, expected in zip(switches[:3], desired):
            current = switch.get_attribute("aria-checked") == "true"
            if current != expected:
                self.driver.execute_script("arguments[0].click();", switch)
                self._wait().until(lambda _driver, item=switch, value=expected: (item.get_attribute("aria-checked") == "true") == value)

    def recruiter_search_and_save(
        self,
        candidate_name: str,
        domain: str,
        position: str,
    ) -> None:
        from selenium.webdriver.common.by import By

        self.open("/recruiter/candidate-search")
        keyword = self._visible((By.CSS_SELECTOR, 'input[placeholder="Tên, chuyên môn, địa điểm"]'))
        keyword.clear()
        keyword.send_keys(candidate_name)
        self._click_text("Tìm kiếm", "button")
        card = self._visible(
            (By.XPATH, f"//*[contains(@class,'ant-card')][.//*[contains(normalize-space(.),{json.dumps(candidate_name, ensure_ascii=False)})]]")
        )
        existing = card.find_elements(By.XPATH, ".//*[contains(normalize-space(.),'Đã có trong Talent Pool')]")
        if existing:
            return
        save = card.find_elements(By.XPATH, ".//button[contains(normalize-space(.),'Lưu Talent Pool')]")
        if not save:
            raise AssertionError("Có ứng viên nhưng không có nút Lưu Talent Pool.")
        save[0].click()
        modal = self._visible((By.CSS_SELECTOR, ACTIVE_MODAL_PANEL_SELECTOR))
        selects = modal.find_elements(By.CSS_SELECTOR, ".ant-select-selector")
        if len(selects) < 2:
            raise AssertionError("Form lưu Talent Pool không có đủ Lĩnh vực và Vị trí mục tiêu.")
        self._choose_ant_select(selects[0], domain)
        self._choose_ant_select(selects[1], position)
        submit = modal.find_element(By.XPATH, ".//button[contains(@class,'ant-btn-primary')]")
        submit.click()
        self._wait().until(
            lambda driver: "Đã lưu ứng viên vào Talent Pool" in driver.find_element(By.TAG_NAME, "body").text
        )

    def _choose_ant_select(self, selector: Any, search_text: str) -> None:
        from selenium.webdriver.common.by import By
        from selenium.webdriver.common.keys import Keys

        self.driver.execute_script(
            "arguments[0].scrollIntoView({block:'center'});",
            selector,
        )
        time.sleep(0.2)
        try:
            selector.click()
        except Exception:
            self.driver.execute_script(
                "const inner=arguments[0].querySelector('.ant-select-selector'); "
                "(inner || arguments[0]).click();",
                selector,
            )
        self._visible((By.CSS_SELECTOR, ".ant-select-dropdown:not(.ant-select-dropdown-hidden)"))

        normalized_search = search_text.strip().casefold()

        def matching_options(_driver: Any) -> list[Any] | bool:
            visible_dropdowns = [
                item
                for item in self.driver.find_elements(By.CSS_SELECTOR, ".ant-select-dropdown")
                if item.is_displayed()
            ]
            if not visible_dropdowns:
                return False
            current_options = visible_dropdowns[-1].find_elements(
                By.CSS_SELECTOR,
                ".ant-select-item-option:not(.ant-select-item-option-disabled)",
            )
            matches = [
                item for item in current_options
                if item.text.strip().casefold() == normalized_search
            ]
            return matches or False

        # Ưu tiên chọn từ danh sách đã tải. Cách này ổn định hơn khi nhãn dài
        # có dấu hoặc ký tự /, (), đồng thời tránh làm trống danh sách bằng
        # một truy vấn search được gửi trước lúc React cập nhật options.
        try:
            matching = self._wait(4).until(matching_options)
        except Exception:
            matching = []
        if matching:
            matching[0].click()
            return

        search_inputs = selector.find_elements(
            By.CSS_SELECTOR,
            "input.ant-select-selection-search-input, input.ant-select-input",
        )
        active_inputs = [item for item in search_inputs if item.is_displayed()]
        if active_inputs:
            active_inputs[-1].send_keys(search_text)

        try:
            matching = self._wait().until(matching_options)
        except Exception as error:
            visible_dropdowns = [
                item
                for item in self.driver.find_elements(By.CSS_SELECTOR, ".ant-select-dropdown")
                if item.is_displayed()
            ]
            available = [
                item.text.strip()
                for item in (visible_dropdowns[-1].find_elements(
                    By.CSS_SELECTOR,
                    ".ant-select-item-option:not(.ant-select-item-option-disabled)",
                ) if visible_dropdowns else [])
            ]
            raise AssertionError(
                f"Danh mục không có lựa chọn cho: {search_text}. "
                f"Các lựa chọn đang hiển thị: {available[:20]}"
            ) from error
        matching[0].click()
        if active_inputs:
            active_inputs[-1].send_keys(Keys.ESCAPE)

    def _form_item_selector(self, label: str) -> Any:
        from selenium.webdriver.common.by import By

        label_element = self._visible(
            (
                By.XPATH,
                f"//label[normalize-space(.)={json.dumps(label, ensure_ascii=False)}]",
            )
        )
        input_id = label_element.get_attribute("for")
        if not input_id:
            raise AssertionError(f"Nhãn '{label}' không liên kết với trường dữ liệu.")
        xpath = (
            f"//*[@id={json.dumps(input_id)}]"
            "/ancestor::div[contains(concat(' ',normalize-space(@class),' '),' ant-select ')][1]"
        )
        return self._clickable((By.XPATH, xpath))

    def _choose_form_select(self, label: str, value: str) -> None:
        from selenium.webdriver.common.by import By
        from selenium.webdriver.common.keys import Keys

        last_error: Exception | None = None
        for attempt in range(3):
            selector = self._form_item_selector(label)
            try:
                self._choose_ant_select(selector, value)
                return
            except AssertionError as error:
                last_error = error
                inputs = selector.find_elements(By.CSS_SELECTOR, "input")
                if inputs:
                    inputs[-1].send_keys(Keys.CONTROL, "a")
                    inputs[-1].send_keys(Keys.BACKSPACE)
                self.driver.find_element(By.TAG_NAME, "body").send_keys(Keys.ESCAPE)
                if attempt < 2:
                    time.sleep(2)
        raise AssertionError(
            f"Không thể chọn '{value}' trong trường '{label}' sau 3 lần tải lại danh mục."
        ) from last_error

    def _choose_cascader(self, label: str, path: tuple[str, ...]) -> None:
        from selenium.webdriver.common.by import By
        from selenium.webdriver.common.keys import Keys

        if not path:
            raise ValueError(f"Cascader '{label}' cần ít nhất một cấp.")
        try:
            selector = self._form_item_selector(label)
        except Exception as error:
            raise AssertionError(f"Không tìm thấy ô chọn phân cấp '{label}'.") from error
        selector.click()
        for option_label in path:
            option_xpath = (
                "//div[contains(@class,'ant-select-dropdown') and "
                "not(contains(@class,'ant-select-dropdown-hidden'))]"
                f"//li[.//*[normalize-space(.)={json.dumps(option_label, ensure_ascii=False)}]]"
            )
            try:
                option = self._clickable((By.XPATH, option_xpath))
            except Exception as error:
                visible_dropdowns = [
                    item.text.strip()
                    for item in self.driver.find_elements(By.CSS_SELECTOR, ".ant-select-dropdown")
                    if item.is_displayed()
                ]
                raise AssertionError(
                    f"Danh mục '{label}' không có lựa chọn '{option_label}'. "
                    f"Các lựa chọn đang hiển thị: {visible_dropdowns}"
                ) from error
            self.driver.execute_script("arguments[0].scrollIntoView({block:'nearest'});", option)
            option.click()
        self.driver.find_element(By.TAG_NAME, "body").send_keys(Keys.ESCAPE)

    def _replace_field(self, field_id: str, value: str) -> None:
        from selenium.webdriver.common.by import By
        from selenium.webdriver.common.keys import Keys

        field = self._visible((By.ID, field_id))
        self.driver.execute_script("arguments[0].scrollIntoView({block:'center'});", field)
        field.send_keys(Keys.CONTROL, "a")
        field.send_keys(value)

    def _set_date_field(self, field_id: str, value: Any) -> None:
        from selenium.webdriver.common.by import By
        from selenium.webdriver.common.keys import Keys

        field = self._visible((By.ID, field_id))
        self.driver.execute_script("arguments[0].scrollIntoView({block:'center'});", field)
        field.click()
        field.send_keys(Keys.CONTROL, "a")
        field.send_keys(value.strftime("%d/%m/%Y"))
        field.send_keys(Keys.ENTER)
        field.send_keys(Keys.ESCAPE)

    def _criterion_card(self, index: int) -> Any:
        from selenium.webdriver.common.by import By

        title = f"Tiêu chí {index + 1}"
        title_element = self._visible(
            (
                By.XPATH,
                "//*[contains(concat(' ',normalize-space(@class),' '),' ant-card-head-title ') "
                f"and normalize-space(.)={json.dumps(title, ensure_ascii=False)}]",
            )
        )
        return title_element.find_element(
            By.XPATH,
            "./ancestor::div[contains(concat(' ',normalize-space(@class),' '),' ant-card ')][1]",
        )

    def _choose_select_by_input_id(self, input_id: str, value: str) -> None:
        from selenium.webdriver.common.by import By

        selector = self._clickable(
            (
                By.XPATH,
                f"//*[@id={json.dumps(input_id)}]"
                "/ancestor::div[contains(concat(' ',normalize-space(@class),' '),' ant-select ')][1]",
            )
        )
        self._choose_ant_select(selector, value)

    def recruiter_create_job(self, fixture: JobFixture) -> dict[str, str]:
        from selenium.webdriver.common.by import By

        self.open("/recruiter/jobs/create")
        self.driver.execute_script(
            "window.localStorage.removeItem('recruitinsight:job-draft:new');"
        )
        self.driver.refresh()
        self.assert_healthy_page()

        self._choose_cascader("Lĩnh vực & Chuyên ngành", fixture.category_path)
        self._choose_cascader("Cấp bậc (Level)", fixture.level_path)
        self._choose_form_select("Vị trí tuyển dụng", fixture.position)
        self._choose_form_select("Địa điểm", fixture.branch)
        self._replace_field("salaryRange", fixture.salary_range)
        self._set_date_field("startDate", fixture.start_date)
        self._set_date_field("deadline", fixture.deadline)
        self._replace_field("maxCandidates", str(fixture.max_candidates))
        self._replace_field("description", fixture.description)
        self._replace_field("requirements", fixture.requirements)

        existing_cards = len(
            self.driver.find_elements(
                By.XPATH,
                "//*[contains(@class,'ant-card-head-title') and starts-with(normalize-space(.),'Tiêu chí ')]",
            )
        )
        for _ in range(max(0, len(fixture.criteria) - existing_cards)):
            add_button = self._clickable(
                (By.XPATH, "//button[normalize-space(.)='Thêm tiêu chí']")
            )
            self.driver.execute_script("arguments[0].scrollIntoView({block:'center'});", add_button)
            add_button.click()
        self._wait().until(
            lambda driver: len(
                driver.find_elements(
                    By.XPATH,
                    "//*[contains(@class,'ant-card-head-title') and starts-with(normalize-space(.),'Tiêu chí ')]",
                )
            ) >= len(fixture.criteria)
        )

        for index, criterion in enumerate(fixture.criteria):
            self._replace_field(f"criteria_{index}_name", criterion.name)
            self._replace_field(f"criteria_{index}_weight", str(criterion.weight))
            self._choose_select_by_input_id(
                f"criteria_{index}_priorityLevel", criterion.priority
            )

            card = self._criterion_card(index)
            collapse = card.find_element(By.CSS_SELECTOR, ".ant-collapse-header")
            if collapse.get_attribute("aria-expanded") != "true":
                self.driver.execute_script("arguments[0].click();", collapse)
            self._choose_select_by_input_id(
                f"criteria_{index}_criterionGroupId", criterion.group
            )
            if criterion.group == "Tổng kinh nghiệm liên quan":
                self._choose_select_by_input_id(
                    f"criteria_{index}_operator", "Tối thiểu"
                )
            if criterion.min_duration_months:
                self._replace_field(
                    f"criteria_{index}_minDurationMonths",
                    str(criterion.min_duration_months),
                )
            if criterion.guidance:
                self._replace_field(
                    f"criteria_{index}_evaluationGuidance", criterion.guidance
                )

        submit = self._clickable(
            (By.XPATH, "//button[normalize-space(.)='Gửi duyệt tin']")
        )
        self.driver.execute_script("arguments[0].scrollIntoView({block:'center'});", submit)
        submit.click()
        self._wait(max(self.config.timeout_seconds, 60)).until(
            lambda driver: "/recruiter/jobs" in driver.current_url
            and "/create" not in driver.current_url
        )
        body = self.driver.find_element(By.TAG_NAME, "body").text
        if "Tạo tin tuyển dụng thành công" not in body and fixture.position not in body:
            raise AssertionError(
                f"Form đã rời trang tạo nhưng chưa tìm thấy xác nhận cho {fixture.position}."
            )
        path_parts = [part for part in urlparse(self.driver.current_url).path.split("/") if part]
        job_id = path_parts[2] if len(path_parts) == 3 and path_parts[:2] == ["recruiter", "jobs"] else ""
        if not job_id:
            raise AssertionError(
                "Backend đã tạo tin nhưng giao diện không trả về JobID nên không thể nối ma trận CV "
                "với đúng tin vừa tạo."
            )
        return {"title": fixture.position, "job_id": job_id}

    def recruiter_repost_expired_job(self, job_title: str = "") -> str:
        from selenium.webdriver.common.by import By

        self.open("/recruiter/jobs")
        candidates = self.driver.find_elements(
            By.XPATH,
            "//*[contains(@class,'ant-card') or self::tr][.//*[contains(normalize-space(.),'Hết hạn')]]",
        )
        if job_title:
            candidates = [item for item in candidates if job_title.lower() in item.text.lower()]
        for item in candidates:
            buttons = item.find_elements(By.XPATH, ".//button[normalize-space(.)='Đăng lại']")
            if buttons:
                source_text = item.text
                buttons[0].click()
                self._wait().until(lambda driver: "/repost" in driver.current_url)
                description = self._visible((By.ID, "description"))
                requirements = self._visible((By.ID, "requirements"))
                if len(description.get_attribute("value") or "") < 100:
                    raise AssertionError("Tin đăng lại không sao chép đủ mô tả công việc.")
                if len(requirements.get_attribute("value") or "") < 80:
                    raise AssertionError("Tin đăng lại không sao chép đủ yêu cầu công việc.")
                self._click_text("Tạo đợt mới và gửi duyệt", "button")
                self._wait(max(self.config.timeout_seconds, 45)).until(lambda driver: "/recruiter/jobs" in driver.current_url)
                return source_text.splitlines()[0] if source_text else job_title
        raise AssertionError("Không tìm thấy tin hết hạn có nút Đăng lại.")

    def admin_approve_job(self, job_title: str, job_id: str = "") -> None:
        from selenium.webdriver.common.by import By

        if job_id:
            self.open(f"/admin/jobs/{quote(job_id)}")
            self._wait().until(
                lambda driver: "Đang hoạt động" in driver.find_element(By.TAG_NAME, "body").text
                or "Chờ duyệt" in driver.find_element(By.TAG_NAME, "body").text
            )
            detail_body = self.driver.find_element(By.TAG_NAME, "body").text
            if "Đang hoạt động" in detail_body:
                return

        self.open("/admin/approval")
        search = self._visible((By.CSS_SELECTOR, 'input[placeholder^="Tìm theo vị trí"]'))
        search.clear()
        search.send_keys(job_title)
        row_xpath = (
            f"//tr[@data-row-key={json.dumps(job_id)}]"
            if job_id
            else f"//tr[.//*[contains(normalize-space(.),{json.dumps(job_title, ensure_ascii=False)})]]"
        )
        self._wait().until(lambda driver: len(driver.find_elements(By.XPATH, row_xpath)) > 0)
        rows = self.driver.find_elements(By.XPATH, row_xpath)
        pending_row = None
        approve_button = None
        for row in rows:
            approve = row.find_elements(By.XPATH, ".//button[normalize-space(.)='Duyệt']")
            if approve:
                pending_row = row
                approve_button = approve[0]
                break
        if pending_row is None or approve_button is None:
            if any("Đang tuyển" in row.text or "Đã duyệt" in row.text for row in rows):
                return
            target_description = f"JobID {job_id}" if job_id else f"tin {job_title}"
            raise AssertionError(f"Không tìm thấy bản ghi chờ duyệt đúng với {target_description}.")
        self.driver.execute_script(
            "arguments[0].scrollIntoView({block:'center'});", approve_button
        )
        approve_button.click()
        self._wait().until(
            lambda driver: "Duyệt tin tuyển dụng thành công" in driver.find_element(By.TAG_NAME, "body").text
            or not driver.find_elements(By.XPATH, row_xpath)
            or not driver.find_elements(By.XPATH, row_xpath + "//button[normalize-space(.)='Duyệt']")
        )

    def admin_ensure_criterion_group_active(self, group_name: str) -> str:
        from selenium.webdriver.common.by import By

        self.open("/admin/organization?tab=criterion-groups")
        row_xpath = (
            "//tbody/tr[contains(@class,'ant-table-row') and "
            f".//td[normalize-space(.)={json.dumps(group_name, ensure_ascii=False)}]]"
        )
        row = self._visible((By.XPATH, row_xpath), max(self.config.timeout_seconds, 60))
        if "Đang dùng" in row.text:
            return "already_active"
        buttons = row.find_elements(By.XPATH, ".//button[normalize-space(.)='Kích hoạt']")
        if not buttons:
            raise AssertionError(
                f"Nhóm tiêu chí '{group_name}' đang ẩn nhưng không có nút Kích hoạt."
            )
        self.driver.execute_script("arguments[0].click();", buttons[0])
        self._wait().until(
            lambda driver: "Đã kích hoạt nhóm tiêu chí" in driver.find_element(By.TAG_NAME, "body").text
            or "Đang dùng" in driver.find_element(By.XPATH, row_xpath).text
        )
        return "activated"

    def recruiter_repair_job_skill_groups(
        self,
        job_id: str,
        expected_skill_names: tuple[str, ...],
    ) -> str:
        from selenium.webdriver.common.by import By

        edit_url = f"/recruiter/jobs/{quote(job_id)}/edit"
        last_load_error: Exception | None = None
        for attempt in range(3):
            self.open(edit_url)
            try:
                self._wait(15).until(
                    lambda driver: len(
                        driver.find_elements(
                            By.XPATH,
                            "//*[contains(@class,'ant-card-head-title') and "
                            "starts-with(normalize-space(.),'Tiêu chí ')]",
                        )
                    ) >= len(expected_skill_names)
                )
                last_load_error = None
                break
            except Exception as error:
                last_load_error = error
                if attempt < 2:
                    time.sleep(20)
        if last_load_error is not None:
            body = self.driver.find_element(By.TAG_NAME, "body").text
            raise AssertionError(
                f"Không tải được tám tiêu chí của JobID {job_id} sau 3 lần thử. "
                f"Trang hiện hiển thị: {' | '.join(body.splitlines()[-8:])}"
            ) from last_load_error
        for index, expected_name in enumerate(expected_skill_names):
            name_field = self._visible((By.ID, f"criteria_{index}_name"))
            actual_name = (name_field.get_attribute("value") or "").strip()
            if actual_name.casefold() != expected_name.strip().casefold():
                raise AssertionError(
                    f"JobID {job_id} có tiêu chí {index + 1} là '{actual_name}', "
                    f"không phải '{expected_name}'."
                )
            card = self._criterion_card(index)
            collapse = card.find_element(By.CSS_SELECTOR, ".ant-collapse-header")
            if collapse.get_attribute("aria-expanded") != "true":
                self.driver.execute_script("arguments[0].click();", collapse)
            self._choose_select_by_input_id(
                f"criteria_{index}_criterionGroupId",
                "Kỹ năng",
            )
            selector = self._clickable(
                (
                    By.XPATH,
                    f"//*[@id='criteria_{index}_criterionGroupId']"
                    "/ancestor::div[contains(concat(' ',normalize-space(@class),' '),' ant-select ')][1]",
                )
            )
            selected_text = " ".join(selector.text.split())
            if selected_text.casefold() != "kỹ năng":
                raise AssertionError(
                    f"JobID {job_id} chưa chọn đúng nhóm Kỹ năng tại tiêu chí {index + 1}: "
                    f"'{selected_text}'."
                )

        submit = self._clickable(
            (By.XPATH, "//button[normalize-space(.)='Lưu và gửi duyệt lại']")
        )
        self.driver.execute_script("arguments[0].scrollIntoView({block:'center'});", submit)
        submit.click()
        self._wait(max(self.config.timeout_seconds, 60)).until(
            lambda driver: urlparse(driver.current_url).path.rstrip("/") == "/recruiter/jobs"
        )
        return "repaired"

    def dashboard_snapshot(self, role: str) -> dict[str, str]:
        from selenium.webdriver.common.by import By

        path = "/admin/dashboard" if role == "admin" else "/recruiter/dashboard"
        self.open(path)
        labels = ["CV nhận hôm nay", "Chuyển trạng thái hôm nay", "Tổng số CV đã nhận"]
        values: dict[str, str] = {}
        for label in labels:
            matches = self.driver.find_elements(
                By.XPATH,
                f"//*[normalize-space(.)={json.dumps(label, ensure_ascii=False)}]/ancestor::*[contains(@class,'ant-card')][1]",
            )
            if matches:
                text = matches[0].text.splitlines()
                values[label] = " | ".join(text[:4])
        if role == "recruiter" and not values:
            raise AssertionError("Dashboard HR không hiển thị các chỉ số trong ngày.")
        return values

    def recruiter_job_ai_snapshots(self, job_id: str) -> list[dict[str, Any]]:
        """Đọc snapshot AI đã lưu của đúng một chiến dịch qua session HR hiện tại."""
        response = self.driver.execute_async_script(
            """
            const jobId = arguments[0];
            const done = arguments[arguments.length - 1];
            const token = window.localStorage.getItem('token');
            fetch(`/api/Recruitment/hr/applications?includeAiDetails=true&jobId=${encodeURIComponent(jobId)}`, {
              headers: { Authorization: `Bearer ${token}` }
            })
              .then(async result => {
                let body = null;
                try { body = await result.json(); } catch { body = null; }
                done({ status: result.status, body });
              })
              .catch(error => done({ status: 0, error: String(error) }));
            """,
            job_id,
        )
        status = int(response.get("status", 0) or 0) if isinstance(response, dict) else 0
        if status != 200:
            raise AssertionError(
                f"Không đọc được snapshot AI của JobID {job_id}; HTTP {status or 'network_error'}."
            )
        payload = response.get("body") if isinstance(response, dict) else []
        if isinstance(payload, dict) and isinstance(payload.get("data"), list):
            payload = payload["data"]
        elif isinstance(payload, dict) and isinstance(payload.get("data"), dict):
            payload = payload["data"].get("$values", [])
        if isinstance(payload, dict):
            payload = payload.get("$values", [])
        if not isinstance(payload, list):
            raise AssertionError(f"Payload snapshot AI của JobID {job_id} không phải danh sách.")
        items = [item for item in payload if isinstance(item, dict)]
        foreign_job_count = sum(
            1 for item in items if str(item.get("jobId") or "") != job_id
        )
        if foreign_job_count:
            raise AssertionError(
                f"API lọc JobID {job_id} trả lẫn {foreign_job_count} hồ sơ của chiến dịch khác."
            )
        return items

    def recruiter_campaign_scores(self, job_id: str) -> list[dict[str, Any]]:
        from selenium.webdriver.common.by import By

        self.open(f"/recruiter/applications/{quote(job_id)}")
        self._wait(max(self.config.timeout_seconds, 60)).until(
            lambda driver: len(driver.find_elements(By.CSS_SELECTOR, "tbody tr.ant-table-row")) > 0
            or "Không có dữ liệu" in driver.find_element(By.TAG_NAME, "body").text
            or "Không thể tải dữ liệu" in driver.find_element(By.TAG_NAME, "body").text
        )
        if "Không thể tải dữ liệu" in self.driver.find_element(By.TAG_NAME, "body").text:
            raise AssertionError("Trang chiến dịch không tải được danh sách ứng viên.")

        results: dict[str, dict[str, Any]] = {}
        visited_pages = 0
        while visited_pages < 20:
            visited_pages += 1
            rows = self.driver.find_elements(By.CSS_SELECTOR, "tbody tr.ant-table-row")
            for row in rows:
                text_value = row.text.strip()
                email_match = re.search(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", text_value, re.IGNORECASE)
                row_key = row.get_attribute("data-row-key") or f"row-{len(results) + 1}"
                email = email_match.group(0) if email_match else row_key
                score_match = re.search(r"(?<!\d)(\d{1,3}(?:[.,]\d+)?)\s*/\s*100", text_value)
                score = float(score_match.group(1).replace(",", ".")) if score_match else None
                ai_status = (
                    "completed" if score is not None
                    else "failed" if "AI gặp lỗi" in text_value or "Lỗi AI" in text_value
                    else "processing"
                )
                results[email.casefold()] = {
                    "application_id": row_key,
                    "email": email,
                    "score": score,
                    "ai_status": ai_status,
                }

            next_buttons = self.driver.find_elements(By.CSS_SELECTOR, "li.ant-pagination-next")
            if not next_buttons or "ant-pagination-disabled" in (next_buttons[0].get_attribute("class") or ""):
                break
            before_keys = tuple(item.get_attribute("data-row-key") for item in rows)
            next_buttons[0].click()
            self._wait().until(
                lambda driver: tuple(
                    item.get_attribute("data-row-key")
                    for item in driver.find_elements(By.CSS_SELECTOR, "tbody tr.ant-table-row")
                ) != before_keys
            )

        payload = self.recruiter_job_ai_snapshots(job_id)
        if payload:
            details_by_id = {
                str(item.get("id") or item.get("applicationId")): item
                for item in (payload or [])
                if isinstance(item, dict) and str(item.get("jobId") or "") == job_id
            }
            for item in results.values():
                detail = details_by_id.get(str(item.get("application_id") or ""), {})
                account_email = str(detail.get("accountEmail") or detail.get("email") or "").strip()
                if account_email:
                    item["email"] = account_email
                item["criteria_results"] = detail.get("criteriaResults") or []
        return list(results.values())

    def wait_for_ai_result(self, candidate_email: str) -> str:
        if self.config.wait_ai_seconds <= 0:
            return "skipped"
        deadline = time.monotonic() + self.config.wait_ai_seconds
        while time.monotonic() < deadline:
            self.open("/my-applications")
            body = self.driver.page_source
            if "AI gặp lỗi" in body:
                return "failed"
            if "AI đang phân tích" not in body and "Chờ AI" not in body:
                return "completed"
            time.sleep(min(10, max(1, deadline - time.monotonic())))
        return "timeout"

    def write_browser_logs(self, suffix: str = "") -> None:
        if self.driver is None:
            return
        log_dir = self.config.run_dir / "browser-logs"
        log_dir.mkdir(parents=True, exist_ok=True)
        for log_type in ("browser", "performance"):
            try:
                entries = self.driver.get_log(log_type)
            except Exception:
                continue
            if log_type == "performance":
                failures: list[Any] = []
                for entry in entries:
                    try:
                        message = json.loads(entry.get("message", "{}"))["message"]
                        method = message.get("method", "")
                        params = message.get("params", {})
                        if method == "Network.loadingFailed":
                            failures.append(params)
                        elif method == "Network.responseReceived" and params.get("response", {}).get("status", 0) >= 400:
                            failures.append(
                                {
                                    "status": params["response"].get("status"),
                                    "url": params["response"].get("url"),
                                }
                            )
                    except Exception:
                        continue
                entries = failures
            safe_suffix = f"-{suffix}" if suffix else ""
            (log_dir / f"{log_type}{safe_suffix}.json").write_text(
                json.dumps(entries, ensure_ascii=False, indent=2), encoding="utf-8"
            )
