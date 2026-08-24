﻿﻿﻿﻿﻿﻿using Microsoft.AspNetCore.Mvc;
using RecruitmentBackend.DTOs.Requests;
using RecruitmentBackend.Interfaces;
using System.Threading.Tasks;
using RecruitmentBackend.Services;

namespace RecruitmentBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoriesController : ControllerBase
    {
        private readonly ICategoryService _categoryService;
        private readonly IMetadataChangeNotifier _notifier;

        public CategoriesController(ICategoryService categoryService, IMetadataChangeNotifier notifier)
        {
            _categoryService = categoryService;
            _notifier = notifier;
        }

        [HttpGet]
        public async Task<IActionResult> GetCategories()
        {
            var categories = await _categoryService.GetCategoriesAsync();
            return Ok(categories);
        }

        [HttpPost]
        [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateCategory([FromBody] CategoryRequest request)
        {
            if (!ModelState.IsValid || string.IsNullOrWhiteSpace(request.Name))
                return BadRequest("Tên lĩnh vực không được để trống");

            var result = await _categoryService.CreateCategoryAsync(request);
            
            if (result.IsSuccess == false) return BadRequest(result.Message);
            
            await _notifier.NotifyAsync("categories", "created");
            return Ok(result.Data);
        }

        [HttpPut("{id}")]
        [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateCategory(string id, [FromBody] CategoryRequest request)
        {
            if (!ModelState.IsValid || string.IsNullOrWhiteSpace(request.Name))
                return BadRequest("Tên lĩnh vực không được để trống");

            var result = await _categoryService.UpdateCategoryAsync(id, request);
            
            if (result.IsSuccess == false)
            {
                if (result.Message == "Không tìm thấy lĩnh vực") return NotFound(result.Message);
                return BadRequest(result.Message);
            }

            await _notifier.NotifyAsync("categories", "updated");
            return Ok(result.Data);
        }

        [HttpPut("{id}/toggle-status")]
        [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
        public async Task<IActionResult> ToggleCategoryStatus(string id)
        {
            var result = await _categoryService.ToggleCategoryStatusAsync(id);
            
            if (result.IsSuccess == false) return NotFound(result.Message);
            
            await _notifier.NotifyAsync("categories", "status-changed");
            return Ok(result.Data);
        }

        [HttpDelete("{id}")]
        [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCategory(string id)
        {
            var result = await _categoryService.DeleteCategoryAsync(id);
            
            if (result.IsSuccess == false)
            {
                if (result.Message == "Không tìm thấy lĩnh vực") return NotFound(result.Message);
                return BadRequest(result.Message);
            }
            
            await _notifier.NotifyAsync("categories", "deleted");
            return Ok(new { message = result.Message });
        }
    }
}
