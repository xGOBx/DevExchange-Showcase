using DevExchange.Server.Controllers.UserValidation;
using DevExchange.Server.Data;
using DevExchange.Server.Models.Image.Category;
using DevExchange.Server.Models.Image.Category.DTO;
using DevExchange.Server.Models.UserValidation;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace DevExchange.Server.Controllers
{
    /// <summary>
    /// Controller for managing categories, questions, and options in the system.
    /// </summary>
    [ApiController]
    [Route("api/CategoryController")]
    public class CategoryController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        protected readonly UserManager<User> _userManager;
        private readonly IUserValidationService _userValidationService;

        /// <summary>
        /// Initializes a new instance of the <see cref="CategoryController"/> class.
        /// </summary>
        /// <param name="context">The database context to be used by the controller.</param>
        /// <param name="userManager">The user manager for handling user-related operations.</param>
        /// <param name="userValidationService">The service for validating users.</param>
        public CategoryController(ApplicationDbContext context, UserManager<User> userManager, IUserValidationService userValidationService)
        {
            _context = context;
            _userManager = userManager;
            _userValidationService = userValidationService;
        }

        /// <summary>
        /// Creates a new category.
        /// </summary>
        /// <param name="category">The category data to create.</param>
        /// <returns>An action result containing the created category.</returns>
        [HttpPost("categories")]
        public async Task<IActionResult> CreateCategory([FromBody] CategoryModel category)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // Set default creation date if not provided
            if (category.CreatedDate == default)
            {
                category.CreatedDate = DateTime.UtcNow;
            }

            _context.Categories.Add(category);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetCategory), new { id = category.Id }, category);
        }

        /// <summary>
        /// Retrieves a category by its ID.
        /// </summary>
        /// <param name="id">The ID of the category to retrieve.</param>
        /// <returns>An action result containing the category data.</returns>
        [HttpGet("categories/{id}")]
        public async Task<IActionResult> GetCategory(int id)
        {
            var category = await _context.Categories
                .Include(c => c.Questions)
                .ThenInclude(q => q.Options)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (category == null) return NotFound();
            return Ok(category);
        }

        /// <summary>
        /// Retrieves all categories with limited fields: name, isFavorite, isActive, and userId.
        /// </summary>
        /// <returns>An action result containing all categories with selected fields only.</returns>
        [HttpGet("GetAllcategories")]
        public async Task<IActionResult> GetAllCategories()
        {
            var categories = await _context.Categories
                .Select(c => new
                {
                    c.Id,
                    c.CategoryName,
                    c.isFeatured,
                    c.isActive,
                    c.UserId,
                    c.CreatedDate,
                    c.ConfigLinkId
                })
                .ToListAsync();

            if (categories == null || !categories.Any())
                return NotFound("No categories found");

            return Ok(categories);
        }



        /// <summary>
        /// Creates a new question for a category.
        /// </summary>
        /// <param name="categoryId">The ID of the category to add the question to.</param>
        /// <param name="question">The question data to create.</param>
        /// <returns>An action result containing the created question.</returns>
        [HttpPost("categories/{categoryId}/questions")]
        public async Task<IActionResult> CreateQuestion(int categoryId, [FromBody] QuestionCreateModel questionDto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // Ensure the category exists
            var category = await _context.Categories.FindAsync(categoryId);
            if (category == null)
            {
                return BadRequest($"Category with ID {categoryId} does not exist");
            }

            // Create a Question entity from the DTO
            var question = new Question
            {
                QuestionKey = questionDto.QuestionKey,
                QuestionText = questionDto.QuestionText,
                CategoryId = categoryId,
                Options = questionDto.Options?.Select(o => new QuestionOption
                {
                    OptionText = o.OptionText,
                }).ToList() ?? new List<QuestionOption>()
            };

            _context.Questions.Add(question);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetQuestion), new { id = question.Id }, question);
        }
        /// <summary>
        /// Retrieves a question by its ID.
        /// </summary>
        /// <param name="id">The ID of the question to retrieve.</param>
        /// <returns>An action result containing the question data.</returns>
        [HttpGet("questions/{id}")]
        public async Task<IActionResult> GetQuestion(int id)
        {
            var question = await _context.Questions
                .Include(q => q.Options)
                .FirstOrDefaultAsync(q => q.Id == id);

            if (question == null) return NotFound();
            return Ok(question);
        }

        /// <summary>
        /// Creates a new option for a question.
        /// </summary>
        /// <param name="option">The option data to create.</param>
        /// <returns>An action result containing the created option.</returns>
        [HttpPost("options")]
        public async Task<IActionResult> CreateOption([FromBody] QuestionOption option)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // Ensure the question exists
            if (!await QuestionExists(option.QuestionId))
            {
                return BadRequest($"Question with ID {option.QuestionId} does not exist");
            }

            _context.QuestionOptions.Add(option);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetOption), new { id = option.Id }, option);
        }

        /// <summary>
        /// Retrieves an option by its ID.
        /// </summary>
        /// <param name="id">The ID of the option to retrieve.</param>
        /// <returns>An action result containing the option data.</returns>
        [HttpGet("options/{id}")]
        public async Task<IActionResult> GetOption(int id)
        {
            var option = await _context.QuestionOptions.FindAsync(id);
            if (option == null) return NotFound();
            return Ok(option);
        }

        /// <summary>
        /// Retrieves all categories with limited fields: name, isFavorite, isActive, and userId.
        /// </summary>
        /// <returns>An action result containing all categories with selected fields only.</returns>
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetCategoriesByUserId(string userId)
        {
            var categories = await _context.Categories
                .Where(c => c.UserId == userId)
                .Select(c => new
                {
                    c.Id,
                    c.CategoryName,
                    c.isFeatured,
                    c.isActive,
                    c.UserId,
                    c.CreatedDate,
                    c.ConfigLinkId
                })
                .ToListAsync();

            if (categories == null || !categories.Any())
                return NotFound($"No categories found for user with ID {userId}");

            return Ok(categories);
        }
        /// <summary>
        /// Updates an existing category.
        /// </summary>
        /// <param name="id">The ID of the category to update.</param>
        /// <param name="category">The updated category data.</param>
        /// <returns>An action result indicating success or failure.</returns>
        [HttpPut("categories/{id}")]
        public async Task<IActionResult> UpdateCategory(int id, [FromBody] CategoryModel category)
        {
            if (id != category.Id) return BadRequest("ID mismatch");
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // Get the existing category
            var existingCategory = await _context.Categories.FindAsync(id);
            if (existingCategory == null)
                return NotFound($"Category with ID {id} not found");

            // Preserve the original creation date
            category.CreatedDate = existingCategory.CreatedDate;

            _context.Entry(existingCategory).State = EntityState.Detached;
            _context.Entry(category).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await CategoryExists(id))
                    return NotFound();
                throw;
            }

            return NoContent();
        }

        /// <summary>
        /// Deletes a category by ID.
        /// </summary>
        /// <param name="id">The ID of the category to delete.</param>
        /// <returns>An action result indicating success or failure.</returns>
        [HttpDelete("categories/{id}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null) return NotFound();

            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        /// <summary>
        /// Updates an existing question.
        /// </summary>
        /// <param name="id">The ID of the question to update.</param>
        /// <param name="question">The updated question data.</param>
        /// <returns>An action result indicating success or failure.</returns>
        [HttpPut("questions/{id}")]
        public async Task<IActionResult> UpdateQuestion(int id, [FromBody] Question question)
        {
            if (id != question.Id) return BadRequest("ID mismatch");
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // Ensure the category exists
            if (!await CategoryExists(question.CategoryId))
            {
                return BadRequest($"Category with ID {question.CategoryId} does not exist");
            }

            var existingQuestion = await _context.Questions.FindAsync(id);
            if (existingQuestion == null)
                return NotFound($"Question with ID {id} not found");

            _context.Entry(existingQuestion).State = EntityState.Detached;
            _context.Entry(question).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await QuestionExists(id))
                    return NotFound();
                throw;
            }

            return NoContent();
        }

        /// <summary>
        /// Deletes a question by ID.
        /// </summary>
        /// <param name="id">The ID of the question to delete.</param>
        /// <returns>An action result indicating success or failure.</returns>
        [HttpDelete("questions/{id}")]
        public async Task<IActionResult> DeleteQuestion(int id)
        {
            var question = await _context.Questions.FindAsync(id);
            if (question == null) return NotFound();

            _context.Questions.Remove(question);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        /// <summary>
        /// Updates an existing question option.
        /// </summary>
        /// <param name="id">The ID of the option to update.</param>
        /// <param name="option">The updated option data.</param>
        /// <returns>An action result indicating success or failure.</returns>
        [HttpPut("options/{id}")]
        public async Task<IActionResult> UpdateOption(int id, [FromBody] QuestionOption option)
        {
            if (id != option.Id) return BadRequest("ID mismatch");
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // Ensure the question exists
            if (!await QuestionExists(option.QuestionId))
            {
                return BadRequest($"Question with ID {option.QuestionId} does not exist");
            }

            var existingOption = await _context.QuestionOptions.FindAsync(id);
            if (existingOption == null)
                return NotFound($"Option with ID {id} not found");

            _context.Entry(existingOption).State = EntityState.Detached;
            _context.Entry(option).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await OptionExists(id))
                    return NotFound();
                throw;
            }

            return NoContent();
        }

        /// <summary>
        /// Deletes a question option by ID.
        /// </summary>
        /// <param name="id">The ID of the option to delete.</param>
        /// <returns>An action result indicating success or failure.</returns>
        [HttpDelete("options/{id}")]
        public async Task<IActionResult> DeleteOption(int id)
        {
            var option = await _context.QuestionOptions.FindAsync(id);
            if (option == null) return NotFound();

            _context.QuestionOptions.Remove(option);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        /// <summary>
        /// Gets all questions for a specific category.
        /// </summary>
        /// <param name="categoryId">The ID of the category.</param>
        /// <returns>An action result containing the questions.</returns>
        [HttpGet("categories/{categoryId}/questions")]
        public async Task<IActionResult> GetQuestionsByCategory(int categoryId)
        {
            if (!await CategoryExists(categoryId))
                return NotFound($"Category with ID {categoryId} not found");

            var questions = await _context.Questions
                .Where(q => q.CategoryId == categoryId)
                .Include(q => q.Options)
                .ToListAsync();

            if (!questions.Any())
                return Ok(new List<Question>()); // Return empty list instead of 404

            return Ok(questions);
        }

        /// <summary>
        /// Gets all options for a specific question.
        /// </summary>
        /// <param name="questionId">The ID of the question.</param>
        /// <returns>An action result containing the options.</returns>
        [HttpGet("questions/{questionId}/options")]
        public async Task<IActionResult> GetOptionsByQuestion(int questionId)
        {
            if (!await QuestionExists(questionId))
                return NotFound($"Question with ID {questionId} not found");

            var options = await _context.QuestionOptions
                .Where(o => o.QuestionId == questionId)
                .ToListAsync();

            if (!options.Any())
                return Ok(new List<QuestionOption>()); // Return empty list instead of 404

            return Ok(options);
        }

        /// <summary>
        /// Adds multiple options to a question at once.
        /// </summary>
        /// <param name="questionId">The ID of the question.</param>
        /// <param name="options">The collection of options to add.</param>
        /// <returns>An action result containing the added options.</returns>
        [HttpPost("questions/{questionId}/options")]
        public async Task<IActionResult> AddOptionsToQuestion(int questionId, [FromBody] List<QuestionOption> options)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            if (!await QuestionExists(questionId))
                return NotFound($"Question with ID {questionId} not found");

            // Ensure all options have the correct questionId
            foreach (var option in options)
            {
                option.QuestionId = questionId;
            }

            await _context.QuestionOptions.AddRangeAsync(options);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetOptionsByQuestion), new { questionId }, options);
        }

        /// <summary>
        /// Gets categories by feature status (featured or not featured)
        /// </summary>
        /// <param name="isFeatured">Whether to get featured categories</param>
        /// <returns>An action result containing categories matching the feature status</returns>
        [HttpGet("categories/featured/{isFeatured}")]
        public async Task<IActionResult> GetCategoriesByFeatureStatus(bool isFeatured)
        {
            var categories = await _context.Categories
                .Where(c => c.isFeatured == isFeatured && c.isActive)
                .Select(c => new
                {
                    c.Id,
                    c.CategoryName,
                    c.isFeatured,
                    c.isActive,
                    c.UserId,
                    c.CreatedDate,
                    c.ConfigLinkId
                })
                .ToListAsync();

            if (!categories.Any())
                return Ok(new List<object>()); // Return empty list instead of 404

            return Ok(categories);
        }

        /// <summary>
        /// Gets categories by configuration link ID
        /// </summary>
        /// <param name="configLinkId">The configuration link ID</param>
        /// <returns>An action result containing categories with the specified config link ID</returns>
        [HttpGet("categories/configlink/{configLinkId}")]
        public async Task<IActionResult> GetCategoriesByConfigLinkId(int configLinkId)
        {
            var categories = await _context.Categories
                .Where(c => c.ConfigLinkId == configLinkId && c.isActive)
                .Select(c => new
                {
                    c.Id,
                    c.CategoryName,
                    c.isFeatured,
                    c.isActive,
                    c.UserId,
                    c.CreatedDate,
                    c.ConfigLinkId
                })
                .ToListAsync();

            if (!categories.Any())
                return Ok(new List<object>()); // Return empty list instead of 404

            return Ok(categories);
        }

        /// <summary>
        /// Retrieves available categories for a specific user.
        /// </summary>
        /// <param name="userId">The user ID to get categories for.</param>
        /// <returns>Returns the list of categories available for the user.</returns>
        [HttpGet("categories/user/{userId}")]
        public async Task<IActionResult> GetUserCategories(string userId)
        {
            try
            {
                var categories = await (
                    from category in _context.Categories
                    join userAnswer in _context.UserAnswer on category.Id equals userAnswer.CategoryId
                    where userAnswer.UserId == userId
                    select new
                    {
                        ConfigLinkId = category.ConfigLinkId,
                        Name = category.CategoryName,
                    })
                    .Distinct()
                    .ToListAsync();

                if (!categories.Any())
                {
                    return NotFound("No categories found for this user.");
                }

                return Ok(categories);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "An error occurred while retrieving categories.");
            }


        }
        /// <summary>
        /// Updates only the text of an existing question.
        /// </summary>
        /// <param name="id">The ID of the question to update.</param>
        /// <param name="questionUpdate">Object containing the updated text.</param>
        /// <returns>An action result indicating success or failure.</returns>
        [HttpPut("questions/{id}/text")]
        public async Task<IActionResult> UpdateQuestionText(int id, [FromBody] QuestionTextUpdateDto questionUpdate)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var existingQuestion = await _context.Questions
                .FindAsync(id);

            if (existingQuestion == null)
                return NotFound($"Question with ID {id} not found");

            // Only update the text field
            existingQuestion.QuestionText = questionUpdate.Text;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await QuestionExists(id))
                    return NotFound();
                throw;
            }

            return NoContent();
        }
        /// <summary>
        /// Gets the total count of categories in the system.
        /// </summary>
        /// <returns>An action result containing the total count of categories.</returns>
        [HttpGet("categories/count")]
        public async Task<IActionResult> GetCategoriesCount()
        {
            try
            {
                int totalCount = await _context.Categories.CountAsync();
                return Ok(totalCount);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred while retrieving the category count: {ex.Message}");
            }
        }

        // Helper methods to check existence
        private async Task<bool> CategoryExists(int id)
        {
            return await _context.Categories.AnyAsync(c => c.Id == id);
        }

        private async Task<bool> QuestionExists(int id)
        {
            return await _context.Questions.AnyAsync(q => q.Id == id);
        }

        private async Task<bool> OptionExists(int id)
        {
            return await _context.QuestionOptions.AnyAsync(o => o.Id == id);
        }

    }

    public class QuestionTextUpdateDto
    {
        [Required]
        public string Text { get; set; }
    }
}

