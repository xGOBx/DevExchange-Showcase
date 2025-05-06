using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DevExchange.Server.Data;
using System.Text;
using DevExchange.Server.Controllers.UserValidation;
using Microsoft.AspNetCore.Identity;
using System.Linq;

namespace DevExchange.Server.Controllers.Quiz
{
    /// <summary>
    /// Controller to manage and retrieve answer statistics related to quizzes.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class AnswerStatisticsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IUserValidationService _userValidationService;
        private readonly SecureWebsiteController _secureWebsiteController;

        /// <summary>
        /// Initializes the AnswerStatisticsController with necessary dependencies.
        /// </summary>
        /// <param name="context">The application database context.</param>
        /// <param name="userValidationService">The service for user validation.</param>
        /// <param name="secureWebsiteController">The controller for secure website operations.</param>
        public AnswerStatisticsController(ApplicationDbContext context, IUserValidationService userValidationService, SecureWebsiteController secureWebsiteController)
        {
            _context = context;
            _userValidationService = userValidationService;
            _secureWebsiteController = secureWebsiteController;
        }

        /// <summary>
        /// Retrieves answer statistics for a specific image in a given category.
        /// </summary>
        /// <param name="categoryId">The category ID.</param>
        /// <param name="imageName">The image name.</param>
        /// <returns>Returns a summary of answer statistics grouped by question and option.</returns>
        [HttpGet("image/{categoryId}/{imageName}")]
        public async Task<ActionResult> GetStatsForImage(int categoryId, string imageName)
        {
            try
            {
                var userAnswers = await _context.UserAnswer
                    .Where(ua => ua.CategoryId == categoryId && ua.ImageName == imageName)
                    .ToListAsync();

                var groupedResults = userAnswers
                    .GroupBy(ua => new { ua.QuestionId, ua.QuestionOptionId })
                    .Select(g => new
                    {
                        g.Key.QuestionId,
                        g.Key.QuestionOptionId,
                        AnswerCount = g.Count()
                    })
                    .ToList();

                var result = groupedResults
                    .GroupBy(r => r.QuestionId)
                    .Select(g => new
                    {
                        QuestionId = g.Key,
                        userAnswers.FirstOrDefault(ua => ua.QuestionId == g.Key)?.CategoryName,
                        Options = g.ToDictionary(x => x.QuestionOptionId.ToString(), x => x.AnswerCount)
                    })
                    .ToList();

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Retrieves answer statistics for a specific category.
        /// </summary>
        /// <param name="categoryId">The category ID.</param>
        /// <returns>Returns the aggregated statistics for the answers in the given category.</returns>
        [HttpGet("{categoryId}")]
        public async Task<ActionResult> GetStatsForCategory(int categoryId)
        {
            var category = await _context.Categories
                .FirstOrDefaultAsync(c => c.Id == categoryId);

            if (category == null)
            {
                return NotFound(new { message = "Category not found" });
            }

            var userAnswers = await _context.UserAnswer
                .Where(ua => ua.CategoryId == categoryId)
                .ToListAsync();

            if (!userAnswers.Any())
            {
                return NotFound(new { message = "No statistics found for this category" });
            }

            var stats = userAnswers
                .GroupBy(ua => new { ua.QuestionId, ua.CategoryName })
                .Select(g => new
                {
                    g.Key.QuestionId,
                    g.Key.CategoryName,
                    Options = g.GroupBy(ua => ua.QuestionOptionId)
                               .ToDictionary(o => o.Key.ToString(), o => o.Count())
                })
                .ToList();

            var formattedStats = stats
                .GroupBy(s => new { s.QuestionId, s.CategoryName })
                .Select(g => new
                {
                    g.Key.QuestionId,
                    g.Key.CategoryName,
                    Options = g.SelectMany(x => x.Options)
                               .GroupBy(o => o.Key)
                               .ToDictionary(o => o.Key, o => o.Sum(k => k.Value))
                })
                .ToList();

            return Ok(formattedStats);
        }

        /// <summary>
        /// Retrieves category data based on a configuration link ID.
        /// </summary>
        /// <param name="configLinkId">The configuration link ID.</param>
        /// <returns>Returns the category data grouped by questions and options.</returns>
        [HttpGet("config/{configLinkId}")]
        public async Task<IActionResult> GetCategoryDataByConfigLink(int configLinkId)
        {
            try
            {
                var categoryData = await _context.Categories
                    .Where(category => category.ConfigLinkId == configLinkId)
                    .Join(_context.UserAnswer,
                        category => category.Id,
                        userAnswer => userAnswer.CategoryId,
                        (category, userAnswer) => new { category, userAnswer })
                    .Join(_context.ImageUploads,
                        combined => combined.userAnswer.ImagePath,
                        image => image.ImagePath,
                        (combined, image) => new
                        {
                            CategoryId = combined.category.Id,
                            CategoryName = combined.category.CategoryName,
                            QuestionId = combined.userAnswer.QuestionId,
                            QuestionOptionId = combined.userAnswer.QuestionOptionId,
                            ImageName = image.ImageName,
                            ImagePath = image.ImagePath
                        })
                    .ToListAsync();
                if (!categoryData.Any())
                {
                    return NotFound(new { message = "No data found for the given ConfigLinkId" });
                }

                var groupedData = categoryData
                    .GroupBy(c => new { c.CategoryId, c.CategoryName })
                    .Select(category => new
                    {
                        category.Key.CategoryId,
                        category.Key.CategoryName,
                        Questions = category.GroupBy(q => q.QuestionId)
                                            .Select(qGroup => new
                                            {
                                                QuestionId = qGroup.Key,
                                                Options = qGroup.Select(q => new
                                                {
                                                    q.QuestionOptionId,
                                                    q.ImageName,
                                                    q.ImagePath
                                                }).ToList()
                                            }).ToList()
                    }).ToList();

                return Ok(groupedData);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving data." });
            }
        }

        /// <summary>
        /// Retrieves all questions related to a specific category.
        /// </summary>
        /// <param name="categoryId">The category ID.</param>
        /// <returns>Returns the questions and options associated with the specified category.</returns>
        [HttpGet("category/{categoryId}")]
        public async Task<IActionResult> GetCategoryQuestions(int categoryId)
        {
            var results = await _context.UserAnswer
                .Where(ua => ua.CategoryId == categoryId)
                .Select(ua => new
                {
                    ua.CategoryId,
                    ua.CategoryName,
                    ua.QuestionId,
                    ua.QuestionOptionId,
                    ua.ImageName,
                    ua.ImagePath
                })
                .ToListAsync();

            if (results == null || !results.Any())
                return NotFound("No data found for the given category.");

            return Ok(results);
        }


        [HttpGet("config/sorted")]
        public async Task<IActionResult> GetSortedImageDataByConfigLink([FromQuery] string userId)
        {
            var userConfigLinkIds = await GetUserConfigLinkIds(userId);

            if (!userConfigLinkIds.Any())
            {
                return NotFound("No categories found for the given user.");
            }


            var categoryData = await _context.Categories
                .Where(category => userConfigLinkIds.Contains(category.ConfigLinkId))
                .Join(_context.UserAnswer,
                    category => category.Id,
                    userAnswer => userAnswer.CategoryId,
                    (category, userAnswer) => new { category, userAnswer })
                .Join(_context.ImageUploads,
                    combined => combined.userAnswer.ImagePath,
                    image => image.ImagePath,
                    (combined, image) => new { combined.category, combined.userAnswer, image })
                .Join(_context.Questions,
                    combined => combined.userAnswer.QuestionId,
                    question => question.Id,
                    (combined, question) => new { combined.category, combined.userAnswer, combined.image, question })
                .Join(_context.QuestionOptions,
                    combined => combined.userAnswer.QuestionOptionId,
                    questionOption => questionOption.Id,
                    (combined, questionOption) => new
                    {
                        CategoryId = combined.category.Id,
                        CategoryName = combined.category.CategoryName,
                        ConfigLinkId = combined.category.ConfigLinkId,
                        QuestionId = combined.userAnswer.QuestionId,
                        QuestionOptionId = combined.userAnswer.QuestionOptionId,
                        OptionText = questionOption.OptionText,
                        ImageName = combined.image.ImageName,
                        ImagePath = combined.image.ImagePath,
                        QuestionText = combined.question.QuestionText
                    })
                .ToListAsync();

            if (!categoryData.Any())
            {
                return NotFound("No data found for the given categories.");
            }

            var sortedData = categoryData
                .GroupBy(c => c.ConfigLinkId)
                .Select(configGroup => new
                {
                    ConfigLinkId = configGroup.Key,
                    CategoryName = configGroup.First().CategoryName,
                    Images = configGroup
                        .GroupBy(c => new { c.ImageName, c.ImagePath })
                        .Select(g => new
                        {
                            g.Key.ImageName,
                            g.Key.ImagePath,
                            Questions = g
                                .GroupBy(q => q.QuestionText)
                                .Select(qg => new
                                {
                                    QuestionText = qg.Key,
                                    Options = qg
                                        .GroupBy(o => o.OptionText)
                                        .Select(og => new
                                        {
                                            OptionText = og.Key,
                                            QuestionCount = og.Count()
                                        })
                                        .ToList()
                                })
                                .ToList()
                        })
                        .ToList()
                })
                .ToList();

            return Ok(sortedData);
        }

        private async Task<List<int>> GetUserConfigLinkIds(string userId)
        {
            return await _context.Categories
                .Where(c => c.UserId == userId)
                .Select(c => c.ConfigLinkId)
                .Distinct()
                .ToListAsync();
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
                var categories = await _context.Categories
                    .Join(_context.UserAnswer,
                        category => category.Id,
                        userAnswer => userAnswer.CategoryId,
                        (category, userAnswer) => new
                        {
                            ConfigLinkId = category.ConfigLinkId,
                            Name = category.CategoryName,
                            UserId = userAnswer.UserId
                        })
                    .Where(x => x.UserId == userId)
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
        /// Exports answer statistics data for a user in JSON format.
        /// </summary>
        /// <param name="userId">The user ID to export statistics for.</param>
        /// <returns>A JSON file containing the answer statistics.</returns>
        [HttpGet("export/json")]
        public async Task<IActionResult> ExportStatisticsAsJson([FromQuery] string userId)
        {
            try
            {
                var userConfigLinkIds = await GetUserConfigLinkIds(userId);

                if (!userConfigLinkIds.Any())
                {
                    return NotFound("No categories found for the given user.");
                }

                var categoryData = await _context.Categories
                    .Where(category => userConfigLinkIds.Contains(category.ConfigLinkId))
                    .Join(_context.UserAnswer,
                        category => category.Id,
                        userAnswer => userAnswer.CategoryId,
                        (category, userAnswer) => new { Category = category, UserAnswer = userAnswer })
                    .Join(_context.ImageUploads,
                        x => x.UserAnswer.ImagePath,
                        image => image.ImagePath,
                        (x, image) => new { x.Category, x.UserAnswer, Image = image })
                    .Join(_context.Questions,
                        x => x.UserAnswer.QuestionId,
                        question => question.Id,
                        (x, question) => new { x.Category, x.UserAnswer, x.Image, Question = question })
                    .Join(_context.QuestionOptions,
                        x => x.UserAnswer.QuestionOptionId,
                        questionOption => questionOption.Id,
                        (x, questionOption) => new
                        {
                            Id = x.Category.Id,
                            CategoryName = x.Category.CategoryName,
                            ConfigLinkId = x.Category.ConfigLinkId,
                            QuestionId = x.UserAnswer.QuestionId,
                            QuestionOptionId = x.UserAnswer.QuestionOptionId,
                            OptionText = questionOption.OptionText,
                            ImageName = x.Image.ImageName,
                            ImagePath = x.Image.ImagePath,
                            QuestionText = x.Question.QuestionText
                        })
                    .ToListAsync();

                if (!categoryData.Any())
                {
                    return NotFound("No data found for the given categories.");
                }

                var sortedData = categoryData
                    .GroupBy(c => c.ConfigLinkId)
                    .Select(configGroup => new
                    {
                        ConfigLinkId = configGroup.Key,
                        CategoryName = configGroup.First().CategoryName,
                        Images = configGroup
                            .GroupBy(c => new { c.ImageName, c.ImagePath })
                            .Select(g => new
                            {
                                g.Key.ImageName,
                                g.Key.ImagePath,
                                Questions = g
                                    .GroupBy(q => q.QuestionText)
                                    .Select(qg => new
                                    {
                                        QuestionText = qg.Key,
                                        Options = qg
                                            .GroupBy(o => o.OptionText)
                                            .Select(og => new
                                            {
                                                OptionText = og.Key,
                                                QuestionCount = og.Count()
                                            })
                                            .ToList()
                                    })
                                    .ToList()
                            })
                            .ToList()
                    })
                    .ToList();

                // Serialize the data to JSON
                var jsonData = System.Text.Json.JsonSerializer.Serialize(sortedData, new System.Text.Json.JsonSerializerOptions
                {
                    WriteIndented = true
                });

                // Create a downloadable file
                byte[] bytes = Encoding.UTF8.GetBytes(jsonData);

                // Generate a filename with timestamp
                string fileName = $"statistics_{userId}_{DateTime.Now:yyyyMMdd_HHmmss}.json";

                return File(bytes, "application/json", fileName);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred while exporting data: {ex.Message}");
            }
        }

        /// <summary>
        /// Exports answer statistics data for a user in CSV format.
        /// </summary>
        /// <param name="userId">The user ID to export statistics for.</param>
        /// <returns>A CSV file containing the answer statistics.</returns>
        [HttpGet("export/csv")]
        public async Task<IActionResult> ExportStatisticsAsCsv([FromQuery] string userId)
        {
            try
            {
                var userConfigLinkIds = await GetUserConfigLinkIds(userId);

                if (!userConfigLinkIds.Any())
                {
                    return NotFound("No categories found for the given user.");
                }

                var categoryData = await _context.Categories
                    .Where(category => userConfigLinkIds.Contains(category.ConfigLinkId))
                    .Join(_context.UserAnswer,
                        category => category.Id,
                        userAnswer => userAnswer.CategoryId,
                        (category, userAnswer) => new { category, userAnswer })
                    .Join(_context.ImageUploads,
                        temp => temp.userAnswer.ImagePath,
                        image => image.ImagePath,
                        (temp, image) => new { temp.category, temp.userAnswer, image })
                    .Join(_context.Questions,
                        temp => temp.userAnswer.QuestionId,
                        question => question.Id,
                        (temp, question) => new { temp.category, temp.userAnswer, temp.image, question })
                    .Join(_context.QuestionOptions,
                        temp => temp.userAnswer.QuestionOptionId,
                        questionOption => questionOption.Id,
                        (temp, questionOption) => new
                        {
                            CategoryId = temp.category.Id,
                            CategoryName = temp.category.CategoryName,
                            ConfigLinkId = temp.category.ConfigLinkId,
                            QuestionId = temp.userAnswer.QuestionId,
                            QuestionOptionId = temp.userAnswer.QuestionOptionId,
                            OptionText = questionOption.OptionText,
                            ImageName = temp.image.ImageName,
                            ImagePath = temp.image.ImagePath,
                            QuestionText = temp.question.QuestionText
                        })
                    .ToListAsync();

                if (!categoryData.Any())
                {
                    return NotFound("No data found for the given categories.");
                }

                // Build CSV content
                var csv = new StringBuilder();

                // Add CSV header
                csv.AppendLine("ConfigLinkId,CategoryName,ImageName,ImagePath,QuestionText,OptionText,Count");

                // Process the data into flattened CSV rows
                foreach (var group in categoryData.GroupBy(c => c.ConfigLinkId))
                {
                    var configLinkId = group.Key;
                    var categoryName = group.First().CategoryName;

                    foreach (var imageGroup in group.GroupBy(c => new { c.ImageName, c.ImagePath }))
                    {
                        var imageName = imageGroup.Key.ImageName.Replace(",", ";"); // Escape commas
                        var imagePath = imageGroup.Key.ImagePath.Replace(",", ";"); // Escape commas

                        foreach (var questionGroup in imageGroup.GroupBy(q => q.QuestionText))
                        {
                            var questionText = questionGroup.Key.Replace(",", ";").Replace("\n", " "); // Escape commas and newlines

                            foreach (var optionGroup in questionGroup.GroupBy(o => o.OptionText))
                            {
                                var optionText = optionGroup.Key.Replace(",", ";").Replace("\n", " "); // Escape commas and newlines
                                var count = optionGroup.Count();

                                // Add the CSV row
                                csv.AppendLine($"{configLinkId},{EscapeCsvField(categoryName)},{EscapeCsvField(imageName)},{EscapeCsvField(imagePath)},{EscapeCsvField(questionText)},{EscapeCsvField(optionText)},{count}");
                            }
                        }
                    }
                }

                // Create a downloadable file
                byte[] bytes = Encoding.UTF8.GetBytes(csv.ToString());

                // Generate a filename with timestamp
                string fileName = $"statistics_{userId}_{DateTime.Now:yyyyMMdd_HHmmss}.csv";

                return File(bytes, "text/csv", fileName);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred while exporting data: {ex.Message}");
            }
        }

        // Helper method to properly escape CSV fields
        private string EscapeCsvField(string field)
        {
            if (string.IsNullOrEmpty(field))
                return string.Empty;

            // If the field contains quotes, commas, or newlines, wrap it in quotes and double any quotes within it
            bool requiresQuoting = field.Contains(",") || field.Contains("\"") || field.Contains("\n") || field.Contains("\r");

            if (requiresQuoting)
            {
                return "\"" + field.Replace("\"", "\"\"") + "\"";
            }

            return field;
        }


        [HttpGet("user/configlink-user-count")]
        public async Task<IActionResult> GetUniqueUserCountByConfigLinkTimeFrame([FromQuery] string userId)
        {
            try
            {
                // Get the user's config link IDs
                var userConfigLinkIds = await GetUserConfigLinkIds(userId);
                if (!userConfigLinkIds.Any())
                {
                    return NotFound("No categories found for the given user.");
                }

                var now = DateTime.UtcNow;
                var userCounts = new Dictionary<int, Dictionary<string, int>>();

                foreach (var configLinkId in userConfigLinkIds)
                {
                    var configLinkCounts = new Dictionary<string, int>();

                    // Precise time frame calculations to avoid overlap
                    configLinkCounts["1_day"] = await CountUniqueUsersInConfigLinkTimeFrame(
                        configLinkId,
                        now.Date.AddDays(-1),
                        now.Date
                    );

                    configLinkCounts["3_days"] = await CountUniqueUsersInConfigLinkTimeFrame(
                        configLinkId,
                        now.Date.AddDays(-3),
                        now.Date
                    );

                    configLinkCounts["7_days"] = await CountUniqueUsersInConfigLinkTimeFrame(
                        configLinkId,
                        now.Date.AddDays(-7),
                        now.Date
                    );

                    configLinkCounts["30_days"] = await CountUniqueUsersInConfigLinkTimeFrame(
                        configLinkId,
                        now.Date.AddDays(-30),
                        now.Date
                    );

                    configLinkCounts["all_time"] = await CountUniqueUsersInConfigLinkTimeFrame(
                        configLinkId,
                        DateTime.MinValue,
                        now.Date
                    );

                    userCounts[configLinkId] = configLinkCounts;
                }

                return Ok(userCounts);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred while retrieving user counts: {ex.Message}");
            }
        }

        /// <summary>
        /// Helper method to count unique users who answered questions for a specific config link 
        /// within a precisely defined time frame.
        /// </summary>
        /// <param name="configLinkId">The config link ID to filter categories.</param>
        /// <param name="startTime">The start of the time frame (inclusive).</param>
        /// <param name="endTime">The end of the time frame (exclusive).</param>
        /// <returns>The number of unique users who answered questions.</returns>
        private async Task<int> CountUniqueUsersInConfigLinkTimeFrame(int configLinkId, DateTime startTime, DateTime endTime)
        {
            return await _context.Categories
                .Where(c => c.ConfigLinkId == configLinkId)
                .Join(_context.UserAnswer,
                    category => category.Id,
                    userAnswer => userAnswer.CategoryId,
                    (category, userAnswer) => userAnswer)
                .Where(ua => ua.CreatedDate >= startTime && ua.CreatedDate < endTime)
                .Select(ua => ua.UserId)
                .Distinct()
                .CountAsync();
        }
    }
}













