from utils.logger import logger

def get_user_friendly_error_message(e: Exception, default_msg: str = "Đã xảy ra lỗi trong quá trình xử lý AI. Vui lòng thử lại sau.") -> str:
    """
    Chuyển đổi lỗi hệ thống / API thô (như Gemini 404, 429, Quota, Traceback) 
    thành thông điệp tiếng Việt thân thiện cho người dùng cuối (HR / Ứng viên).
    Lỗi kỹ thuật chi tiết chỉ được lưu trong Log file của Server.
    """
    err_str = str(e).lower()
    
    # Log chi tiết lỗi kỹ thuật ra file log server
    logger.error(f"[SYSTEM ERROR LOGGED]: {e}", exc_info=True)

    if "429" in err_str or "resource_exhausted" in err_str or "rate limit" in err_str:
        return "Hệ thống AI đang nhận quá nhiều lượt gọi cùng lúc. Vui lòng đợi 15-30 giây và thử lại."
    
    if "404" in err_str or "not_found" in err_str:
        return "Dịch vụ AI đang tạm thời bảo trì hoặc mô hình không phản hồi. Vui lòng thử lại sau ít phút."
    
    if "quota" in err_str:
        return "Hệ thống AI tạm thời chạm giới hạn hạn ngạch lượt gọi miễn phí trong ngày. Vui lòng thử lại sau."
        
    if "timeout" in err_str:
        return "Thời gian phản hồi từ AI quá lâu. Vui lòng kiểm tra lại kết nối mạng và thử lại."

    return default_msg
