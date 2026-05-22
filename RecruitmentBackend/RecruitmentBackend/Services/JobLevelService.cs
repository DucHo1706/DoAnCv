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
    public class JobLevelService : IJobLevelService
    {
        private readonly AppDbContext _context;

        public JobLevelService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<object> GetJobLevelsAsync()
        {
            var levels = await _context.JobLevels
                .OrderBy(l => l.Name)
                .ToListAsync();

            var resultList = new List<object>();

            foreach (var level in levels)
            {
                var mappedItem = new 
                { 
                    id = level.JobLevelID, 
                    name = level.Name, 
                    parentId = level.ParentId, 
                    isActive = level.IsActive 
                };
                resultList.Add(mappedItem);
            }

            return resultList;
        }

        public async Task<(bool IsSuccess, string Message, object Data)> CreateJobLevelAsync(JobLevelRequest request)
        {
            string normalizedName = request.Name.Trim();

            var existingLevel = await _context.JobLevels.FirstOrDefaultAsync(l => l.Name.ToLower() == normalizedName.ToLower() && l.ParentId == request.ParentId);
            if (existingLevel != null)
            {
                return (false, "Tên này đã tồn tại trong cùng một cấp", null);
            }

            if (string.IsNullOrEmpty(request.ParentId) == false)
            {
                var parentLevel = await _context.JobLevels.FindAsync(request.ParentId);
                if (parentLevel == null) 
                {
                    return (false, "Cấp bậc cha không tồn tại", null);
                }
            }

            var jobLevel = new JobLevel();
            jobLevel.JobLevelID = Guid.NewGuid().ToString();
            jobLevel.Name = normalizedName;
            
            if (string.IsNullOrEmpty(request.ParentId) == true) {
                jobLevel.ParentId = null;
            } else {
                jobLevel.ParentId = request.ParentId;
            }
            
            jobLevel.IsActive = true;

            _context.JobLevels.Add(jobLevel);
            await _context.SaveChangesAsync();

            var dataToReturn = new { id = jobLevel.JobLevelID, name = jobLevel.Name, parentId = jobLevel.ParentId, isActive = jobLevel.IsActive };
            return (true, "Thêm thành công", dataToReturn);
        }

        public async Task<(bool IsSuccess, string Message, object Data)> UpdateJobLevelAsync(string id, JobLevelRequest request)
        {
            var jobLevel = await _context.JobLevels.FindAsync(id);
            if (jobLevel == null)
            {
                return (false, "Không tìm thấy cấp bậc", null);
            }

            string normalizedName = request.Name.Trim();

            var existingLevel = await _context.JobLevels.FirstOrDefaultAsync(l => l.JobLevelID != id && l.Name.ToLower() == normalizedName.ToLower() && l.ParentId == request.ParentId);
            if (existingLevel != null)
            {
                return (false, "Tên này đã tồn tại trong cùng một cấp", null);
            }

            if (string.IsNullOrEmpty(request.ParentId) == false)
            {
                if (request.ParentId == id)
                {
                    return (false, "Một cấp bậc không thể làm con của chính nó", null);
                }

                var parentLevel = await _context.JobLevels.FindAsync(request.ParentId);
                if (parentLevel == null) 
                {
                    return (false, "Cấp bậc cha không tồn tại", null);
                }
            }

            jobLevel.Name = normalizedName;
            
            if (string.IsNullOrEmpty(request.ParentId) == true) {
                jobLevel.ParentId = null;
            } else {
                jobLevel.ParentId = request.ParentId;
            }
            
            await _context.SaveChangesAsync();

            var dataToReturn = new { id = jobLevel.JobLevelID, name = jobLevel.Name, parentId = jobLevel.ParentId, isActive = jobLevel.IsActive };
            return (true, "Cập nhật thành công", dataToReturn);
        }

        public async Task<(bool IsSuccess, string Message, object Data)> ToggleJobLevelStatusAsync(string id)
        {
            var jobLevel = await _context.JobLevels.FindAsync(id);
            if (jobLevel == null)
            {
                return (false, "Không tìm thấy cấp bậc", null);
            }

            jobLevel.IsActive = !jobLevel.IsActive;
            await _context.SaveChangesAsync();

            string messageText = "";
            if (jobLevel.IsActive == true) {
                messageText = "Đã mở khóa cấp bậc";
            } else {
                messageText = "Đã khóa cấp bậc";
            }

            var dataToReturn = new { message = messageText, isActive = jobLevel.IsActive };
            return (true, messageText, dataToReturn);
        }

        public async Task<(bool IsSuccess, string Message)> DeleteJobLevelAsync(string id)
        {
            var jobLevel = await _context.JobLevels.Include(l => l.SubLevels).FirstOrDefaultAsync(l => l.JobLevelID == id);
            if (jobLevel == null) return (false, "Không tìm thấy cấp bậc");
            if (jobLevel.SubLevels != null && jobLevel.SubLevels.Any() == true) return (false, "Vui lòng xóa các cấp con trước khi xóa cấp cha.");
            
            var hasJobs = await _context.JobPostings.FirstOrDefaultAsync(j => j.JobLevelID == id);
            if (hasJobs != null) return (false, "Không thể xóa do đang có tin tuyển dụng sử dụng cấp bậc này.");

            _context.JobLevels.Remove(jobLevel);
            await _context.SaveChangesAsync();
            return (true, "Xóa cấp bậc thành công");
        }
    }
}