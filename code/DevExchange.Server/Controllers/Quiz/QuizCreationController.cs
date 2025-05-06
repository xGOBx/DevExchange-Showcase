using Azure.Core;
using DevExchange.Server.Controllers.Quiz.QuizDTO;
using DevExchange.Server.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DevExchange.Server.Controllers.Quiz
{
    /// <summary>
    /// Controller responsible for quiz creation and management operations
    /// </summary>
    [ApiController]
    [Route("api/QuizCreationController")]
    public class QuizCreationController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        /// <summary>
        /// Initializes a new instance of the QuizCreationController
        /// </summary>
        /// <param name="context">The application database context</param>
        /// <exception cref="ArgumentNullException">Thrown when context is null</exception>
        public QuizCreationController(ApplicationDbContext context)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
        }

        /// <summary>
        /// Creates a quiz for a specific configuration link
        /// </summary>
        /// <param name="configLinkId">The configuration link identifier</param>
        /// <returns>An ActionResult containing quiz details including category, questions, and images</returns>
        [HttpGet("CreateQuiz/{configLinkId}")]
        public async Task<ActionResult> CreateQuiz(int configLinkId)
        {
            var effectiveUserId = GetEffectiveUserId();
            if (string.IsNullOrEmpty(effectiveUserId))
            {
                return BadRequest(new { message = "User identification is required" });
            }

            var category = await _context.Categories
                .FirstOrDefaultAsync(c => c.ConfigLinkId == configLinkId);

            if (category == null)
            {
                return NotFound(new { message = "Category not found" });
            }

            var images = await _context.ImageUploads
                .Where(i => i.ConfigLinkId == configLinkId)
                .OrderBy(i => i.ImageName)
                .ToListAsync();

            var questions = await _context.Questions
                .Where(q => q.CategoryId == category.Id)
                .Include(q => q.Options)
                .ToListAsync();

            return Ok(new
            {
                category = category.CategoryName,
                categoryId = category.Id,
                questions = questions,
                images = images.Select(img => new
                {
                    imagePath = img.ImagePath,
                    imageName = img.ImageName
                })
            });
        }

        /// <summary>
        /// Submits image-based quiz answers
        /// </summary>
        /// <param name="request">The request containing image answers</param>
        /// <returns>An ActionResult indicating submission status and completion</returns>
        [HttpPost("SubmitImageAnswers")]
        public async Task<ActionResult> SubmitImageAnswers([FromBody] ImageAnswersRequest request)
        {
            try
            {
                if (request == null)
                {
                    return BadRequest(new { message = "Request body is null" });
                }

                if (string.IsNullOrEmpty(request.ImageName))
                {
                    return BadRequest(new { message = "ImageName is required" });
                }

                if (string.IsNullOrEmpty(request.ImagePath))
                {
                    return BadRequest(new { message = "ImagePath is required" });
                }

                if (request.Answers == null || !request.Answers.Any())
                {
                    return BadRequest(new { message = "Answers are required" });
                }

                if (request.CategoryId <= 0)
                {
                    return BadRequest(new { message = "Valid CategoryId is required" });
                }

                var effectiveUserId = GetEffectiveUserId();
                if (string.IsNullOrEmpty(effectiveUserId))
                {
                    return BadRequest(new { message = "User identification is required" });
                }

                var category = await _context.Categories
                    .FirstOrDefaultAsync(c => c.Id == request.CategoryId);

                if (category == null)
                {
                    return BadRequest(new { message = $"Category with ID {request.CategoryId} not found" });
                }

                var questionIds = request.Answers.Select(a => a.QuestionId).ToList();
                var existingQuestions = await _context.Questions
                    .Where(q => questionIds.Contains(q.Id) && q.CategoryId == request.CategoryId)
                    .ToDictionaryAsync(q => q.Id, q => q);

                if (existingQuestions.Count != questionIds.Count)
                {
                    var missingQuestions = questionIds.Where(id => !existingQuestions.ContainsKey(id));
                    return BadRequest(new { message = $"Questions not found: {string.Join(", ", missingQuestions)}" });
                }

                foreach (var answer in request.Answers)
                {
                    var question = existingQuestions[answer.QuestionId];

                    var optionExists = await _context.QuestionOptions
                        .AnyAsync(o => o.Id == answer.OptionId && o.QuestionId == answer.QuestionId);

                    if (!optionExists)
                    {
                        return BadRequest(new { message = $"Invalid option ID {answer.OptionId} for question {answer.QuestionId}" });
                    }

                    var userAnswer = await _context.UserAnswer
                        .FirstOrDefaultAsync(ua =>
                            ua.QuestionId == answer.QuestionId &&
                            ua.ImageName == request.ImageName &&
                            ua.UserId == effectiveUserId);

                    if (userAnswer != null)
                    {
                        userAnswer.QuestionOptionId = answer.OptionId;
                        userAnswer.IsQuestionAnswered = true;
                        userAnswer.ImagePath = request.ImagePath;
                        _context.UserAnswer.Update(userAnswer);
                    }
                    else
                    {
                        userAnswer = new UserAnswer
                        {
                            UserId = effectiveUserId,
                            CategoryId = request.CategoryId,
                            QuestionId = answer.QuestionId,
                            QuestionKey = question.QuestionKey,
                            QuestionOptionId = answer.OptionId,
                            CategoryName = category.CategoryName,
                            ImageName = request.ImageName,
                            ImagePath = request.ImagePath,
                            IsQuestionAnswered = true,
                            IsImageAnswered = true,
                            CreatedDate = DateTime.UtcNow
                        };
                        await _context.UserAnswer.AddAsync(userAnswer);
                    }
                }

                await _context.SaveChangesAsync();

                var totalQuestions = await _context.Questions
                    .CountAsync(q => q.CategoryId == request.CategoryId);

                var answeredQuestions = await _context.UserAnswer
                    .CountAsync(ua =>
                        ua.ImageName == request.ImageName &&
                        ua.UserId == effectiveUserId &&
                        ua.IsQuestionAnswered);

                return Ok(new
                {
                    message = "Answers submitted successfully",
                    isImageComplete = answeredQuestions == totalQuestions,
                    answeredCount = answeredQuestions,
                    totalCount = totalQuestions
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in SubmitImageAnswers: {ex}");
                Console.WriteLine($"Request data: {System.Text.Json.JsonSerializer.Serialize(request)}");

                return StatusCode(500, new
                {
                    message = "Error submitting answers",
                    error = ex.Message,
                    details = ex.InnerException?.Message
                });
            }
        }

        /// <summary>
        /// Retrieves the effective user identifier
        /// </summary>
        /// <returns>A string representing the user or session identifier</returns>
        private string GetEffectiveUserId()
        {
            Request.Headers.TryGetValue("userId", out var userIdHeader);
            var userId = userIdHeader.ToString();

            if (!string.IsNullOrEmpty(userId))
            {
                if (userId.StartsWith("session-"))
                {
                    return userId;
                }
                return userId;
            }

            return $"session-{Guid.NewGuid():N}";
        }
    }
}