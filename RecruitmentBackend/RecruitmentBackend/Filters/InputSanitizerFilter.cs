using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;

namespace RecruitmentBackend.Filters
{
    /// <summary>
    /// ActionFilter toàn cục giúp:
    /// 1. Tự động từ chối các Request có Model State sai định dạng (Malformed JSON/Invalid types)
    /// 2. Làm sạch (Sanitize) tất cả chuỗi string đầu vào, loại bỏ các kịch bản độc hại (XSS / Script Injection / Dangerous Tags)
    /// </summary>
    public class InputSanitizerFilter : ActionFilterAttribute
    {
        private static readonly string[] DangerousPatterns = new[]
        {
            "<script", "</script>", "javascript:", "vbscript:",
            "onload=", "onerror=", "onclick=", "onmouseover=",
            "<iframe", "</iframe>", "<object", "</object>", "<embed"
        };

        public override void OnActionExecuting(ActionExecutingContext context)
        {
            // 1. Kiểm tra tính hợp lệ của Model State
            if (!context.ModelState.IsValid)
            {
                var errors = context.ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .Where(msg => !string.IsNullOrWhiteSpace(msg))
                    .ToList();

                context.Result = new BadRequestObjectResult(new
                {
                    status = 400,
                    message = "Dữ liệu gửi lên không đúng định dạng hoặc chứa thông tin không hợp lệ.",
                    errors = errors
                });
                return;
            }

            // 2. Tự động rà soát và làm sạch các tham số kiểu string trong DTO
            foreach (var argument in context.ActionArguments.Values)
            {
                if (argument == null) continue;
                SanitizeObjectStrings(argument);
            }

            base.OnActionExecuting(context);
        }

        private void SanitizeObjectStrings(object obj)
        {
            if (obj == null) return;
            Type type = obj.GetType();

            // Nếu đối tượng là chuỗi đơn lẻ
            if (type == typeof(string))
            {
                return;
            }

            // Nếu đối tượng là DTO class
            if (type.IsClass && type != typeof(string))
            {
                PropertyInfo[] properties = type.GetProperties(BindingFlags.Public | BindingFlags.Instance);
                foreach (var prop in properties)
                {
                    // Indexed properties require parameters in GetValue and are
                    // not DTO fields that should be sanitized.
                    if (!prop.CanRead || !prop.CanWrite || prop.GetIndexParameters().Length != 0) continue;

                    if (prop.PropertyType == typeof(string))
                    {
                        var val = prop.GetValue(obj) as string;
                        if (!string.IsNullOrEmpty(val))
                        {
                            string cleaned = SanitizeString(val);
                            prop.SetValue(obj, cleaned);
                        }
                    }
                }
            }
        }

        private string SanitizeString(string input)
        {
            if (string.IsNullOrWhiteSpace(input)) return input;

            string sanitized = input.Trim();

            // Rà soát các pattern XSS nguy hiểm
            foreach (var pattern in DangerousPatterns)
            {
                if (sanitized.IndexOf(pattern, StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    sanitized = ReplaceInsensitive(sanitized, pattern, string.Empty);
                }
            }

            return sanitized;
        }

        private string ReplaceInsensitive(string str, string search, string replace)
        {
            int pos = str.IndexOf(search, StringComparison.OrdinalIgnoreCase);
            while (pos >= 0)
            {
                str = str.Remove(pos, search.Length).Insert(pos, replace);
                pos = str.IndexOf(search, StringComparison.OrdinalIgnoreCase);
            }
            return str;
        }
    }
}
