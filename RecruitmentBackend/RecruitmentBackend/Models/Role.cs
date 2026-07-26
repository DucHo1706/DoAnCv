using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace RecruitmentBackend.Models
{
    public class Role
    {
        [Key]
        public string RoleID { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string Name { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        // Lưu danh sách quyền dưới dạng chuỗi phân tách bằng dấu phẩy (đơn giản, không cần bảng phụ)
        public string PermissionsRaw { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public List<string> GetPermissions()
        {
            if (string.IsNullOrWhiteSpace(PermissionsRaw) == true)
            {
                return new List<string>();
            }

            var result = new List<string>();
            foreach (var part in PermissionsRaw.Split(',', StringSplitOptions.RemoveEmptyEntries))
            {
                result.Add(part.Trim());
            }
            return result;
        }

        public void SetPermissions(List<string> permissions)
        {
            PermissionsRaw = permissions == null ? string.Empty : string.Join(",", permissions);
        }
    }
}
