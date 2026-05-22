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
    public class JobPositionService : IJobPositionService
    {
        private readonly AppDbContext _context;

        public JobPositionService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<object> GetJobPositionsAsync()
        {
            // Bước 1: Lấy dữ liệu từ Database
            var positions = await _context.Positions
                .OrderBy(p => p.PositionName)
                .Include(p => p.Category)
                .ToListAsync();

            // Bước 2: Dùng vòng lặp foreach truyền thống thay vì Select chứa dấu ? : phức tạp
            var resultList = new List<object>();

            foreach (var position in positions)
            {
                string categoryName = "Chưa phân loại";
                
                if (position.Category != null)
                {
                    categoryName = position.Category.Name;
                }

                var mappedItem = new 
                { 
                    id = position.PositionID, 
                    name = position.PositionName, 
                    categoryId = position.CategoryID, 
                    categoryName = categoryName,
                    isActive = position.IsActive 
                };

                resultList.Add(mappedItem);
            }

            return resultList;
        }

        public async Task<(bool IsSuccess, string Message, object Data)> CreateJobPositionAsync(JobPositionRequest request)
        {
            string normalizedName = request.Name.Trim();
            
            // 1. Kiểm tra vị trí này đã tồn tại chưa
            var existingPosition = await _context.Positions.FirstOrDefaultAsync(p => p.PositionName.ToLower() == normalizedName.ToLower() && p.CategoryID == request.CategoryId);
            
            if (existingPosition != null)
            {
                return (false, "Vị trí này đã tồn tại trong lĩnh vực đã chọn", null);
            }

            // 2. Tìm lĩnh vực xem có thật sự tồn tại trong DB không (Dùng FindAsync dễ hiểu hơn AnyAsync)
            var category = await _context.Categories.FindAsync(request.CategoryId);
            
            if (category == null)
            {
                return (false, "Lĩnh vực không tồn tại", null);
            }

            // 3. Tạo đối tượng mới
            var position = new Position();
            position.PositionID = Guid.NewGuid().ToString();
            position.PositionName = normalizedName;
            position.CategoryID = request.CategoryId;
            position.IsActive = true;

            _context.Positions.Add(position);
            await _context.SaveChangesAsync();

            var dataToReturn = new { id = position.PositionID, name = position.PositionName, isActive = position.IsActive };
            return (true, "Thêm thành công", dataToReturn);
        }

        public async Task<(bool IsSuccess, string Message, object Data)> UpdateJobPositionAsync(string id, JobPositionRequest request)
        {
            var position = await _context.Positions.FindAsync(id);
            
            if (position == null) 
            {
                return (false, "Không tìm thấy vị trí", null);
            }

            string normalizedName = request.Name.Trim();
            var existingPosition = await _context.Positions.FirstOrDefaultAsync(p => p.PositionID != id && p.PositionName.ToLower() == normalizedName.ToLower() && p.CategoryID == request.CategoryId);
            
            if (existingPosition != null) 
            {
                return (false, "Tên vị trí đã tồn tại trong lĩnh vực đã chọn", null);
            }

            var category = await _context.Categories.FindAsync(request.CategoryId);
            
            if (category == null) 
            {
                return (false, "Lĩnh vực không tồn tại", null);
            }

            position.PositionName = normalizedName;
            position.CategoryID = request.CategoryId;
            await _context.SaveChangesAsync();

            var dataToReturn = new { id = position.PositionID, name = position.PositionName, isActive = position.IsActive };
            return (true, "Cập nhật thành công", dataToReturn);
        }

        public async Task<(bool IsSuccess, string Message, object Data)> TogglePositionStatusAsync(string id)
        {
            var position = await _context.Positions.FindAsync(id);
            
            if (position == null) 
            {
                return (false, "Không tìm thấy vị trí", null);
            }

            position.IsActive = !position.IsActive;
            await _context.SaveChangesAsync();

            string messageText = "";
            if (position.IsActive == true) {
                messageText = "Đã mở khóa vị trí";
            } else {
                messageText = "Đã khóa vị trí";
            }

            var dataToReturn = new { message = messageText, isActive = position.IsActive };
            return (true, messageText, dataToReturn);
        }
    }
}