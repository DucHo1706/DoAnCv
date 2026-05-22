using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data;
using RecruitmentBackend.DTOs.Requests;
using RecruitmentBackend.Interfaces;
using RecruitmentBackend.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace RecruitmentBackend.Services
{
    public class CategoryService : ICategoryService
    {
        private readonly AppDbContext _context;

        public CategoryService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<object> GetCategoriesAsync()
        {
            var categories = await _context.Categories
                .OrderBy(c => c.Name)
                .ToListAsync();

            var resultList = new List<object>();

            foreach (var category in categories)
            {
                var mappedItem = new 
                { 
                    id = category.CategoryID, 
                    name = category.Name, 
                    parentId = category.ParentId, 
                    isActive = category.IsActive 
                };
                resultList.Add(mappedItem);
            }

            return resultList;
        }

        public async Task<(bool IsSuccess, string Message, object Data)> CreateCategoryAsync(CategoryRequest request)
        {
            string normalizedName = request.Name.Trim();

            // 1. Kiểm tra trùng tên trong cùng cấp
            var existingCategory = await _context.Categories.FirstOrDefaultAsync(c => c.Name.ToLower() == normalizedName.ToLower() && c.ParentId == request.ParentId);
            if (existingCategory != null)
            {
                return (false, "Tên này đã tồn tại trong cùng một cấp", null);
            }

            // 2. Kiểm tra danh mục cha có tồn tại không
            if (string.IsNullOrEmpty(request.ParentId) == false)
            {
                var parentCategory = await _context.Categories.FindAsync(request.ParentId);
                if (parentCategory == null) 
                {
                    return (false, "Lĩnh vực cha không tồn tại", null);
                }
            }

            var category = new Category();
            category.CategoryID = Guid.NewGuid().ToString();
            category.Name = normalizedName;
            category.Description = "Chưa cập nhật";
            
            if (string.IsNullOrEmpty(request.ParentId) == true) {
                category.ParentId = null;
            } else {
                category.ParentId = request.ParentId;
            }
            
            category.IsActive = true;

            _context.Categories.Add(category);
            await _context.SaveChangesAsync();

            var dataToReturn = new { id = category.CategoryID, name = category.Name, parentId = category.ParentId, isActive = category.IsActive };
            return (true, "Thêm thành công", dataToReturn);
        }

        public async Task<(bool IsSuccess, string Message, object Data)> UpdateCategoryAsync(string id, CategoryRequest request)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null)
            {
                return (false, "Không tìm thấy lĩnh vực", null);
            }

            string normalizedName = request.Name.Trim();

            var existingCategory = await _context.Categories.FirstOrDefaultAsync(c => c.CategoryID != id && c.Name.ToLower() == normalizedName.ToLower() && c.ParentId == request.ParentId);
            if (existingCategory != null)
            {
                return (false, "Tên này đã tồn tại trong cùng một cấp", null);
            }

            if (string.IsNullOrEmpty(request.ParentId) == false)
            {
                if (request.ParentId == id)
                {
                    return (false, "Một lĩnh vực không thể làm con của chính nó", null);
                }

                var parentCategory = await _context.Categories.FindAsync(request.ParentId);
                if (parentCategory == null) 
                {
                    return (false, "Lĩnh vực cha không tồn tại", null);
                }
            }

            category.Name = normalizedName;
            
            if (string.IsNullOrEmpty(request.ParentId) == true) {
                category.ParentId = null;
            } else {
                category.ParentId = request.ParentId;
            }
            
            await _context.SaveChangesAsync();

            var dataToReturn = new { id = category.CategoryID, name = category.Name, parentId = category.ParentId, isActive = category.IsActive };
            return (true, "Cập nhật thành công", dataToReturn);
        }

        public async Task<(bool IsSuccess, string Message, object Data)> ToggleCategoryStatusAsync(string id)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null)
            {
                return (false, "Không tìm thấy lĩnh vực", null);
            }

            category.IsActive = !category.IsActive;
            await _context.SaveChangesAsync();

            string messageText = "";
            if (category.IsActive == true) {
                messageText = "Đã mở khóa lĩnh vực";
            } else {
                messageText = "Đã khóa lĩnh vực";
            }

            var dataToReturn = new { message = messageText, isActive = category.IsActive };
            return (true, messageText, dataToReturn);
        }

        public async Task<(bool IsSuccess, string Message)> DeleteCategoryAsync(string id)
        {
            var category = await _context.Categories.Include(c => c.SubCategories).Include(c => c.Positions).FirstOrDefaultAsync(c => c.CategoryID == id);
            if (category == null) return (false, "Không tìm thấy lĩnh vực");
            
            if (category.SubCategories != null && category.SubCategories.Any() == true) return (false, "Vui lòng xóa các lĩnh vực con trước khi xóa lĩnh vực cha.");
            if (category.Positions != null && category.Positions.Any() == true) return (false, "Không thể xóa do đang có vị trí công việc tham chiếu tới.");
            
            var hasJobs = await _context.JobPostings.FirstOrDefaultAsync(j => j.CategoryID == id);
            if (hasJobs != null) return (false, "Không thể xóa do đang có tin tuyển dụng sử dụng ngành này.");

            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();
            return (true, "Xóa lĩnh vực thành công");
        }
    }
}