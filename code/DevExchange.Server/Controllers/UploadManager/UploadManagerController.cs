using Microsoft.AspNetCore.Mvc;
using DevExchange.Server.Models.Image.Category;
using DevExchange.Server.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using DevExchange.Server.Controllers.UserValidation;
using DevExchange.Server.Models.Image;
using DevExchange.Server.Models.Image.Category.DTO;
using DevExchange.Server.Models.UserValidation;
using Azure.Core;
using DevExchange.Server.Controllers.UploadManager;
using DevExchange.Server.Controllers.UploadManager.DTO;
using DevExchange.Server.Controllers.Admin.AdminDTO;

namespace DevExchange.Server.Controllers
{
    /// <summary>
    /// Controller to manage image uploads and category creation.
    /// </summary>
    [ApiController]
    [Route("api/UploadManager")]
    public class UploadManagerController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        protected readonly UserManager<User> _userManager;
        private readonly IUserValidationService _userValidationService;
        private readonly IBlobStorageService _blobStorageService;
        private const string CONTROLLER_NAME = "UploadManager";



        /// <summary>
        /// Initializes a new instance of the <see cref="UploadManagerController"/> class.
        /// </summary>
        /// <param name="context">The application database context.</param>
        /// <param name="userManager">The user manager for authentication tasks.</param>
        /// <param name="userValidationService">The service to handle user validation tasks.</param>
        public UploadManagerController(
         ApplicationDbContext context,
         UserManager<User> userManager,
         IUserValidationService userValidationService,
         IBlobStorageService blobStorageService)
        {
            _context = context;
            _userManager = userManager;
            _userValidationService = userValidationService;
            _blobStorageService = blobStorageService;
        }

        /// <summary>Retrieves an image from blob storage by container name and file name.</summary>
        /// <param name="containerName">The name of the container storing the image.</param>
        /// <param name="fileName">The name of the file to retrieve.</param>
        /// <returns>An IActionResult containing the image file or an error response.</returns>
        [HttpGet("image/{containerName}/{fileName}")]
        public async Task<IActionResult> GetImage(string containerName, string fileName)
        {
            try
            {
                // Clean and normalize the container name and file name
                containerName = containerName.ToLowerInvariant().Trim();
                fileName = fileName.Trim();

                // Add logging to help diagnose issues

                // Add retry logic for blob operations
                int maxRetries = 3;
                for (int i = 0; i < maxRetries; i++)
                {
                    try
                    {
                        var stream = await _blobStorageService.DownloadFileAsync(containerName, fileName);

                        // Add caching headers
                        Response.Headers.Add("Cache-Control", "public, max-age=86400"); // 24 hours
                        Response.Headers.Add("ETag", $"\"{fileName}\"");

                        var contentType = GetContentType(fileName);
                        return File(stream, contentType);
                    }
                    catch (Azure.RequestFailedException ex) when (ex.Status == 404)
                    {
                        break; // Don't retry if blob doesn't exist
                    }
                    catch (Exception ex) when (i < maxRetries - 1)
                    {
                        await Task.Delay(1000 * (i + 1)); // Exponential backoff
                        continue;
                    }
                }

                // If we get here, all retries failed or blob not found
                return NotFound(new { success = false, message = "Image not found" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Failed to retrieve image" });
            }
        }

        /// <summary>Determines the content type of a file based on its extension.</summary>
        /// <param name="fileName">The name of the file to determine content type for.</param>
        /// <returns>A string representing the MIME content type.</returns>
        private string GetContentType(string fileName)
        {
            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            return extension switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".gif" => "image/gif",
                ".bmp" => "image/bmp",
                ".webp" => "image/webp",
                _ => "application/octet-stream"
            };
        }

        /// <summary>Uploads images for a user to blob storage and records metadata.</summary>
        /// <param name="formCollection">The form data containing the uploaded files and user information.</param>
        /// <returns>An IActionResult indicating the success or failure of the upload.</returns>
        [HttpPost("uploadImage")]
        public async Task<IActionResult> UploadImage(IFormCollection formCollection)
        {
            try
            {
                // Get the userId from the form data
                var userId = formCollection["userId"].ToString();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { success = false, message = "User not authorized" });
                }

                var files = formCollection.Files;
                if (files == null || files.Count == 0)
                {
                    return BadRequest(new { success = false, message = "No files uploaded" });
                }

                // Find the category for the user
                var category = await _context.Categories
                    .Where(c => c.UserId == userId)
                    .OrderByDescending(c => c.CreatedDate)
                    .FirstOrDefaultAsync();

                if (category == null)
                {
                    return BadRequest(new { success = false, message = "No category found for the user" });
                }

                // Prepare the container name
                var containerName = category.CategoryName.ToLower().Replace(" ", "-");

                // Generate the next GroupId for image uploads
                var groupId = await _context.ImageUploads
                    .OrderByDescending(i => i.GroupId)
                    .Select(i => i.GroupId)
                    .FirstOrDefaultAsync() + 1;

                var uploadedImages = new List<ImageUploadModel>();

                foreach (var file in files)
                {
                    if (file == null || file.Length == 0) continue;

                    var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";

                    using (var stream = file.OpenReadStream())
                    {
                        // Upload to Azure Blob Storage
                        var blobUrl = await _blobStorageService.UploadFileAsync(CONTROLLER_NAME, containerName, fileName, stream);


                        // Create the image metadata to store in your database
                        var image = new ImageUploadModel
                        {
                            ImageName = file.FileName,
                            FolderName = containerName,
                            ImagePath = blobUrl, // Store the full Azure Blob URL
                            CreatedDate = DateTime.UtcNow,
                            GroupId = groupId,
                            ConfigLinkId = category.ConfigLinkId,
                            UserId = userId,
                            isActive = true
                        };

                        // Save the image metadata to the database
                        _context.ImageUploads.Add(image);
                        await _context.SaveChangesAsync();
                        uploadedImages.Add(image);
                    }
                }

                return Ok(new { success = true, message = "Files uploaded successfully", data = uploadedImages });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }


        /// <summary>
        /// Creates or updates a full category for the user, including questions and options.
        /// </summary>
        /// <param name="fullCategory">The full category model containing the category information.</param>
        /// <returns>An action result indicating the success or failure of the category creation.</returns>
        [HttpPost("full-category")]
        public async Task<IActionResult> CreateFullCategory([FromBody] FullCategoryDTO request)
        {
            // Extract userId and fullCategory from the request
            string userId = request.UserId;
            FullCategoryModel fullCategory = request.FullCategory;

            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest(new { success = false, message = "User ID is required." });
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Check if a category with the same name already exists for the user
            var existingCategory = await _context.Categories
                .FirstOrDefaultAsync(c => c.CategoryName == fullCategory.CategoryName && c.UserId == userId);

            // If the category exists, check for duplicate QuestionKeys
            if (existingCategory != null)
            {
                // Get all existing QuestionKeys for the category
                var existingQuestionKeys = await _context.Questions
                    .Where(q => q.CategoryId == existingCategory.Id)
                    .Select(q => q.QuestionKey)
                    .ToListAsync();

                // Check if any of the incoming QuestionKeys already exist
                var duplicateQuestionKeys = fullCategory.Questions
                    .Select(q => q.QuestionKey)
                    .Intersect(existingQuestionKeys)
                    .ToList();

                if (duplicateQuestionKeys.Any())
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "The following QuestionKeys already exist. Please change them and try again.",
                        duplicates = duplicateQuestionKeys
                    });
                }
            }

            CategoryModel category;

            if (existingCategory != null)
            {
                // Use the existing category
                category = existingCategory;
            }
            else
            {
                // Generate a new ConfigLinkId
                var lastConfigLinkId = await _context.Categories
                    .OrderByDescending(c => c.ConfigLinkId)
                    .Select(c => c.ConfigLinkId)
                    .FirstOrDefaultAsync();
                var newConfigLinkId = lastConfigLinkId + 1;  // If no categories exist, lastConfigLinkId will be 0

                // Create a new category
                category = new CategoryModel
                {
                    CategoryName = fullCategory.CategoryName,
                    CreatedDate = DateTime.UtcNow,
                    ConfigLinkId = newConfigLinkId,  // Save the new ConfigLinkId
                    UserId = userId,  // Store the UserId in the category
                    isActive = true,  // Set IsActive to true when creating new category
                    isFeatured = false
                };

                _context.Categories.Add(category);
                await _context.SaveChangesAsync();
            }

            // Process Questions and Options
            var questions = new List<Question>();
            var options = new List<QuestionOption>();

            foreach (var question in fullCategory.Questions)
            {
                var newQuestion = new Question
                {
                    QuestionKey = question.QuestionKey,
                    QuestionText = question.QuestionText,
                    CategoryId = category.Id // Use the category.Id (existing or new)
                };
                questions.Add(newQuestion);
            }

            // Save questions first to get their IDs generated by EF
            _context.Questions.AddRange(questions);
            await _context.SaveChangesAsync();  // Now EF has assigned Ids to the Questions

            // Add options now, using the correct QuestionId from the saved questions
            foreach (var question in fullCategory.Questions.Select((q, index) => new { q, index }))
            {
                var newQuestion = questions[question.index]; // Get the question from the saved list
                foreach (var option in question.q.Options)
                {
                    options.Add(new QuestionOption
                    {
                        OptionText = option.OptionText,
                        QuestionId = newQuestion.Id // Use the correct QuestionId
                    });
                }
            }

            // Save options after questions are saved
            _context.QuestionOptions.AddRange(options);
            await _context.SaveChangesAsync();

            // Return 200 OK with success message
            return Ok(new
            {
                success = true,
                message = "Configuration uploaded successfully!",
                category = new
                {
                    category.Id,
                    category.CategoryName
                }
            });
        }


        /// <summary>Retrieves all active categories grouped by user.</summary>
        /// <returns>An action result containing active categories and their associated user information.</returns>
        [HttpGet("Get-Active-Categories")]
        public async Task<IActionResult> GetAllActiveCategories()
        {
            try
            {
                // Query all active categories grouped by user
                var query = _context.Categories
                    .Where(c => c.isActive)
                    .Select(c => new
                    {
                        Id = c.Id,
                        CategoryName = c.CategoryName,
                        ConfigLinkId = c.ConfigLinkId,
                        UserId = c.UserId, // Add UserId
                        UserName = _context.Users // Add user information
                            .Where(u => u.Id == c.UserId)
                            .Select(u => u.UserName)
                            .FirstOrDefault(),
                        ImagePath = _context.ImageUploads
                            .Where(i => i.ConfigLinkId == c.ConfigLinkId && i.isActive == true)
                            .OrderBy(r => Guid.NewGuid())
                            .Select(i => i.ImagePath)
                            .FirstOrDefault()
                    });

                // Fetch all categories
                var allCategories = await query.ToListAsync();

                // Group categories by user
                var categoriesByUser = allCategories
                    .GroupBy(c => new { c.UserId, c.UserName })
                    .Select(g => new
                    {
                        userId = g.Key.UserId,
                        userName = g.Key.UserName ?? "Unknown User",
                        categories = g.ToList()
                    })
                    .ToList();

                return Ok(new
                {
                    success = true,
                    categoriesByUser = categoriesByUser,
                    totalCategories = allCategories.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>Retrieves featured categories grouped by user.</summary>
        /// <returns>An action result containing featured categories and their associated user information.</returns>
        [HttpGet("Get-Featured-Categories")]
        public async Task<IActionResult> GetFeaturedCategories()
        {
            try
            {
                // Query all active and featured categories grouped by user
                var query = _context.Categories
                    .Where(c => c.isActive && c.isFeatured) // Check both conditions
                    .Select(c => new
                    {
                        Id = c.Id,
                        CategoryName = c.CategoryName,
                        ConfigLinkId = c.ConfigLinkId,
                        UserId = c.UserId,
                        UserName = _context.Users
                            .Where(u => u.Id == c.UserId)
                            .Select(u => u.UserName)
                            .FirstOrDefault(),
                        ImagePath = _context.ImageUploads
                            .Where(i => i.ConfigLinkId == c.ConfigLinkId && i.isActive == true)
                            .OrderBy(r => Guid.NewGuid())
                            .Select(i => i.ImagePath)
                            .FirstOrDefault()
                    });

                // Fetch all featured categories
                var featuredCategories = await query.ToListAsync();

                // Group categories by user
                var categoriesByUser = featuredCategories
                    .GroupBy(c => new { c.UserId, c.UserName })
                    .Select(g => new
                    {
                        userId = g.Key.UserId,
                        userName = g.Key.UserName ?? "Unknown User",
                        categories = g.ToList()
                    })
                    .ToList();

                return Ok(new
                {
                    success = true,
                    categoriesByUser = categoriesByUser,
                    totalCategories = featuredCategories.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>Retrieves all images uploaded by a specific user.</summary>
        /// <param name="userId">The unique identifier of the user.</param>
        /// <returns>An action result containing the user's uploaded images.</returns>
        [HttpGet("byUser/{userId}")]
        public async Task<IActionResult> GetUserImages(string userId)
        {
            try
            {
                var images = await _context.ImageUploads
                    .Where(i => i.UserId == userId)
                    .Select(i => new
                    {
                        id = i.Id,
                        fileName = i.ImageName,
                        configLinkId = i.ConfigLinkId,
                        uploadDate = i.CreatedDate,
                        imagePath = i.ImagePath // This will now be the Azure Blob URL
                    })
                    .ToListAsync();

                return Ok(images);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>Deletes a specific image from blob storage and database.</summary>
        /// <param name="request">The request containing image deletion details.</param>
        /// <returns>An action result indicating the success or failure of the image deletion.</returns>
        [HttpDelete("deleteImage")]
        public async Task<IActionResult> DeleteImage([FromBody] DeleteImageRequest request)
        {
            try
            {
                // Delete from Azure Blob Storage
                await _blobStorageService.DeleteFileAsync(request.ContainerName, request.FileName);

                // Delete from database
                var image = await _context.ImageUploads.FindAsync(request.ImageId);
                if (image != null)
                {
                    _context.ImageUploads.Remove(image);
                    await _context.SaveChangesAsync();
                }

                return Ok(new { success = true, message = "Image deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>Deletes a category and all its associated images.</summary>
        /// <param name="request">The request containing category deletion details.</param>
        /// <returns>An action result indicating the success or failure of the category deletion.</returns>
        [HttpDelete("deleteCategory")]
        public async Task<IActionResult> DeleteCategory([FromBody] DeleteCategoryRequest request)
        {
            try
            {
                // Parse the category ID to int
                if (!int.TryParse(request.CategoryId, out int configLinkId))
                {
                    return BadRequest(new { success = false, message = "Invalid category ID format" });
                }

                // Get all images with this ConfigLinkId
                var images = await _context.ImageUploads
                    .Where(i => i.ConfigLinkId == configLinkId)
                    .ToListAsync();

                // Delete images from blob storage
                foreach (var image in images)
                {
                    try
                    {
                        string containerName;
                        string fileName;

                        if (image.ImagePath.StartsWith("/api/"))
                        {
                            var parts = image.ImagePath.Split('/', StringSplitOptions.RemoveEmptyEntries);
                            if (parts.Length >= 5)
                            {
                                containerName = parts[3].ToLower();
                                fileName = parts[4];
                            }
                            else
                            {
                                continue;
                            }
                        }
                        else if (Uri.TryCreate(image.ImagePath, UriKind.Absolute, out Uri uri))
                        {
                            var segments = uri.Segments;
                            containerName = segments[2].TrimEnd('/').ToLower();
                            fileName = segments[^1];
                        }
                        else
                        {
                            continue;
                        }

                        await _blobStorageService.DeleteFileAsync(containerName, fileName);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Error deleting image {image.ImagePath}: {ex.Message}");
                    }
                }

                // Delete images from database
                _context.ImageUploads.RemoveRange(images);

                // Get and delete the category using the same ConfigLinkId
                var category = await _context.Categories
                    .FirstOrDefaultAsync(c => c.ConfigLinkId == configLinkId);

                if (category != null)
                {
                    _context.Categories.Remove(category);
                }

                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Category and all associated images deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Failed to delete category: {ex.Message}" });
            }
        }

        /// <summary>Updates the featured status of a category.</summary>
        /// <param name="request">The request containing category feature status update information.</param>
        /// <returns>An action result indicating the success or failure of the status update.</returns>
        [HttpPost("UpdateCategoryFeatureStatus")]
        public async Task<IActionResult> UpdateCategoryFeatureStatus([FromBody] UpdateCategoryFeatureRequest request)
        {
            try
            {
                // Find the category by ID
                var category = await _context.Categories.FindAsync(request.categoryId);
                if (category == null)
                {
                    return NotFound(new { success = false, message = "Category not found" });
                }

                // Update the feature status
                category.isFeatured = request.isFeatured;
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Category feature status updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>Updates the active status of a category.</summary>
        /// <param name="request">The request containing category active status update information.</param>
        /// <returns>An action result indicating the success or failure of the status update.</returns>
        [HttpPost("UpdateCategoryActiveStatus")]
        public async Task<IActionResult> UpdateCategoryActiveStatus([FromBody] UpdateCategoryActiveRequest request)
        {
            try
            {
                // Find the category by ID
                var category = await _context.Categories.FindAsync(request.categoryId);
                if (category == null)
                {
                    return NotFound(new { success = false, message = "Category not found" });
                }

                // Update the feature status
                category.isActive = request.isActive;
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Category Active status updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}