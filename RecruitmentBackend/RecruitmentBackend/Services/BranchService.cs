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
    public class BranchService : IBranchService
    {
        private readonly AppDbContext _context;

        public BranchService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<object> GetBranchesAsync()
        {
            var branches = await _context.Branches
                .OrderBy(b => b.BranchName)
                .ToListAsync();

            var resultList = new List<object>();

            foreach (var branch in branches)
            {
                var mappedItem = new 
                { 
                    id = branch.BranchID, 
                    name = branch.BranchName, 
                    isActive = branch.IsActive 
                };
                resultList.Add(mappedItem);
            }

            return resultList;
        }

        public async Task<(bool IsSuccess, string Message, object Data)> CreateBranchAsync(NameOnlyRequest request)
        {
            string normalizedName = request.Name.Trim();

            var existingBranch = await _context.Branches.FirstOrDefaultAsync(b => b.BranchName.ToLower() == normalizedName.ToLower());
            if (existingBranch != null)
            {
                return (false, "Chi nhánh đã tồn tại", null);
            }

            var branch = new Branch();
            branch.BranchID = Guid.NewGuid().ToString();
            branch.BranchName = normalizedName;
            branch.Address = "Chưa cập nhật";
            branch.Phone = "Chưa cập nhật";
            branch.IsActive = true;

            _context.Branches.Add(branch);
            await _context.SaveChangesAsync();

            var dataToReturn = new { id = branch.BranchID, name = branch.BranchName, isActive = branch.IsActive };
            return (true, "Thêm thành công", dataToReturn);
        }

        public async Task<(bool IsSuccess, string Message, object Data)> UpdateBranchAsync(string id, NameOnlyRequest request)
        {
            var branch = await _context.Branches.FindAsync(id);
            if (branch == null)
            {
                return (false, "Không tìm thấy chi nhánh", null);
            }

            string normalizedName = request.Name.Trim();

            var existingBranch = await _context.Branches.FirstOrDefaultAsync(b => b.BranchID != id && b.BranchName.ToLower() == normalizedName.ToLower());
            if (existingBranch != null)
            {
                return (false, "Tên chi nhánh đã tồn tại", null);
            }

            branch.BranchName = normalizedName;
            await _context.SaveChangesAsync();

            var dataToReturn = new { id = branch.BranchID, name = branch.BranchName, isActive = branch.IsActive };
            return (true, "Cập nhật thành công", dataToReturn);
        }

        public async Task<(bool IsSuccess, string Message, object Data)> ToggleBranchStatusAsync(string id)
        {
            var branch = await _context.Branches.FindAsync(id);
            if (branch == null) return (false, "Không tìm thấy chi nhánh", null);

            branch.IsActive = !branch.IsActive;
            await _context.SaveChangesAsync();

            string messageText = branch.IsActive == true ? "Đã mở khóa chi nhánh" : "Đã khóa chi nhánh";
            var dataToReturn = new { message = messageText, isActive = branch.IsActive };
            return (true, messageText, dataToReturn);
        }
    }
}