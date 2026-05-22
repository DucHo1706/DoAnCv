﻿﻿﻿﻿﻿﻿﻿using Microsoft.AspNetCore.Mvc;
using RecruitmentBackend.DTOs.Requests;
using RecruitmentBackend.Interfaces;
using System.Threading.Tasks;

namespace RecruitmentBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoriesController : ControllerBase
    {
        private readonly ICategoryService _categoryService;

        public CategoriesController(ICategoryService categoryService)
        {
            _categoryService = categoryService;
        }

        [HttpGet]
        public async Task<IActionResult> GetCategories()
        {
            var categories = await _categoryService.GetCategoriesAsync();
            return Ok(categories);
        }

        [HttpPost]
        public async Task<IActionResult> CreateCategory([FromBody] CategoryRequest request)
        {
            if (!ModelState.IsValid || string.IsNullOrWhiteSpace(request.Name))
                return BadRequest("Tên lĩnh vực không được để trống");

            var result = await _categoryService.CreateCategoryAsync(request);
            
            if (result.IsSuccess == false) return BadRequest(result.Message);
            
            return Ok(result.Data);
        }

        [HttpPut("{id}")]
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

            return Ok(result.Data);
        }

        [HttpPut("{id}/toggle-status")]
        public async Task<IActionResult> ToggleCategoryStatus(string id)
        {
            var result = await _categoryService.ToggleCategoryStatusAsync(id);
            
            if (result.IsSuccess == false) return NotFound(result.Message);
            
            return Ok(result.Data);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCategory(string id)
        {
            var result = await _categoryService.DeleteCategoryAsync(id);
            
            if (result.IsSuccess == false)
            {
                if (result.Message == "Không tìm thấy lĩnh vực") return NotFound(result.Message);
                return BadRequest(result.Message);
            }
            
            return Ok(new { message = result.Message });
        }
    }
}