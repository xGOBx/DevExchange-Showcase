using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using System;
using System.Threading.Tasks;
using Azure;
using DevExchange.Server.Data;
using DevExchange.Server.Models.UserValidation;
using DevExchange.Server.Models;
using DevExchange.Server.Controllers.UploadManager.WebConnectionDTO;

namespace DevExchange.Server.Controllers.UploadManager
{

    /// <summary>
    /// Controller responsible for managing website connections and associated operations
    /// </summary>
    [ApiController]
    [Route("api/WebsiteConnection")]
    public class WebsiteConnectionController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<User> _userManager;
        private readonly IBlobStorageService _blobStorageService;
        private string CONTROLLER_NAME = "WebsiteConnection";
        private string CONTAINER_NAME = "website-banners";


        /// <summary>
        /// Initializes a new instance of the WebsiteConnectionController
        /// </summary>
        /// <param name="context">The application database context</param>
        /// <param name="userManager">The user manager for handling user-related operations</param>
        /// <param name="blobStorageService">The blob storage service for file operations</param>
        public WebsiteConnectionController(
            ApplicationDbContext context,
            UserManager<User> userManager,
            IBlobStorageService blobStorageService)
        {
            _context = context;
            _userManager = userManager;
            _blobStorageService = blobStorageService;
        }

        /// <summary>
        /// Uploads a new website connection with an associated banner image
        /// </summary>
        /// <param name="formCollection">Form data containing user and website details</param>
        /// <returns>Result of the website connection upload operation</returns>
        [HttpPost("uploadUserProgramData")]
        public async Task<IActionResult> UploadWebsiteConnection(IFormCollection formCollection)
        {
            try
            {
                var userId = formCollection["userId"].ToString();
                if (string.IsNullOrEmpty(userId))
                {
                    return BadRequest(new { success = false, message = "User not found" });
                }

                var files = formCollection.Files;
                if (files == null || files.Count == 0)
                {
                    return BadRequest(new { success = false, message = "No banner image uploaded" });
                }

                var title = formCollection["title"].ToString();
                var link = formCollection["link"].ToString();
                var description = formCollection["description"].ToString();
                var gitHubLink = formCollection["gitHubLink"].ToString();

                if (string.IsNullOrEmpty(title) || string.IsNullOrEmpty(link) || string.IsNullOrEmpty(description))
                {
                    return BadRequest(new { success = false, message = "Title, link and description are required" });
                }

                var file = files[0];
                var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";

                using (var stream = file.OpenReadStream())
                {
                    var blobUrl = await _blobStorageService.UploadFileAsync(CONTROLLER_NAME, CONTAINER_NAME, fileName, stream);

                    var websiteConnection = new WebsiteConnectionModel
                    {
                        Title = title,
                        Link = link,
                        ImagePath = blobUrl,
                        UserId = userId,
                        CreatedDate = DateTime.UtcNow,
                        Description = description,
                        IsActive = false,
                        GitHubLink = gitHubLink
                    };

                    _context.WebsiteConnections.Add(websiteConnection);
                    await _context.SaveChangesAsync();

                    return Ok(new
                    {
                        success = true,
                        message = "Website connection created successfully",
                        data = websiteConnection
                    });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Retrieves active website connections for a specific user
        /// </summary>
        /// <param name="userId">The unique identifier of the user</param>
        /// <returns>List of active website connections for the user</returns>
        [HttpGet("byUser/{userId}")]
        public async Task<IActionResult> GetUserConnections(string userId)
        {
            try
            {
                var connections = await _context.WebsiteConnections
                    .Where(w => w.UserId == userId && w.IsActive)
                    .Select(w => new
                    {
                        id = w.Id,
                        title = w.Title,
                        link = w.Link,
                        imagePath = w.ImagePath,
                        createdDate = w.CreatedDate,
                        gitHubLink = w.GitHubLink
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = connections });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Retrieves an image from blob storage
        /// </summary>
        /// <param name="fileName">The name of the file to retrieve</param>
        /// <returns>The requested image file</returns>
        [HttpGet("image/{fileName}")]
        public async Task<IActionResult> GetWebImages(string fileName)
        {
            try
            {
                var containerName = CONTAINER_NAME.ToLowerInvariant().Trim();
                fileName = fileName.Trim();


                int maxRetries = 3;
                for (int i = 0; i < maxRetries; i++)
                {
                    try
                    {
                        var stream = await _blobStorageService.DownloadFileAsync(containerName, fileName);

                        Response.Headers.Add("Cache-Control", "public, max-age=86400"); // 24 hours
                        Response.Headers.Add("ETag", $"\"{fileName}\"");

                        var contentType = GetContentType(fileName);
                        return File(stream, contentType);
                    }
                    catch (RequestFailedException ex) when (ex.Status == 404)
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

        /// <summary>
        /// Determines the content type based on file extension
        /// </summary>
        /// <param name="fileName">The name of the file</param>
        /// <returns>The MIME content type for the file</returns>
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

        /// <summary>
        /// Retrieves all active website connections
        /// </summary>
        /// <returns>A list of active website connections</returns>
        [HttpGet("active")]
        public async Task<IActionResult> GetActiveConnections()
        {
            try
            {
                var connections = await _context.WebsiteConnections
                    .Where(w => w.IsActive)
                    .Select(w => new
                    {
                        id = w.Id,
                        title = w.Title,
                        link = w.Link,
                        imagePath = w.ImagePath,
                        description = w.Description,
                        createdDate = w.CreatedDate,
                        gitHubLink = w.GitHubLink
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = connections });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Updates the active status of a website connection
        /// </summary>
        /// <param name="request">The request containing connection ID and desired active status</param>
        /// <returns>Result of the status update operation</returns>
        [HttpPost("UpdateConnectionStatus")]
        public async Task<IActionResult> UpdateConnectionStatus([FromBody] UpdateConnectionStatusRequest request)
        {
            try
            {
                var connection = await _context.WebsiteConnections.FindAsync(request.ConnectionId);
                if (connection == null)
                    return NotFound(new { success = false, message = "Connection not found" });

                connection.IsActive = request.IsActive;
                await _context.SaveChangesAsync();

                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Retrieves featured and active website connections
        /// </summary>
        /// <returns>A list of featured and active website connections</returns>
        [HttpGet("featuredActive")]
        public async Task<IActionResult> GetFeaturedActiveConnections()
        {
            try
            {
                var connections = await _context.WebsiteConnections
                    .Where(w => w.IsActive && w.IsFeatured)
                    .Select(w => new
                    {
                        id = w.Id,
                        title = w.Title,
                        link = w.Link,
                        imagePath = w.ImagePath,
                        description = w.Description,
                        createdDate = w.CreatedDate,
                        gitHubLink = w.GitHubLink
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = connections });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Retrieves all website connections with associated user details
        /// </summary>
        /// <returns>A comprehensive list of website connections including user information</returns>
        [HttpGet("GetAllConnections")]
        public async Task<IActionResult> GetAllConnections()
        {
            try
            {
                var connections = await _context.WebsiteConnections
                    .Join(
                        _context.Users,
                        connection => connection.UserId,
                        user => user.Id,
                        (connection, user) => new
                        {
                            id = connection.Id,
                            title = connection.Title,
                            link = connection.Link,
                            imagePath = connection.ImagePath,
                            description = connection.Description,
                            createdDate = connection.CreatedDate,
                            isActive = connection.IsActive,
                            isFeatured = connection.IsFeatured,
                            userId = connection.UserId,
                            userEmail = user.Email,
                            userName = user.UserName,
                            gitHubLink = connection.GitHubLink
                        })
                    .ToListAsync();

                return Ok(new
                {
                    success = true,
                    data = connections
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Updates the featured status of a website connection
        /// </summary>
        /// <param name="request">The request containing connection ID and desired featured status</param>
        /// <returns>Result of the featured status update operation</returns>
        [HttpPost("UpdateConnectionFeatureStatus")]
        public async Task<IActionResult> UpdateConnectionFeatureStatus([FromBody] UpdateConnectionFeatureRequest request)
        {
            try
            {
                var connection = await _context.WebsiteConnections.FindAsync(request.ConnectionId);
                if (connection == null)
                    return NotFound(new { success = false, message = "Connection not found" });

                connection.IsFeatured = request.IsFeatured;
                await _context.SaveChangesAsync();

                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Retrieves website connections owned by the current authenticated user
        /// </summary>
        /// <returns>A list of website connections created by the current user</returns>
        [HttpGet("owned")]
        public async Task<IActionResult> GetUserOwnedConnections()
        {
            try
            {
                var user = await _userManager.GetUserAsync(User);
                if (user == null)
                {
                    return Unauthorized(new { success = false, message = "User not authenticated" });
                }

                // Get connections owned by the current user
                var connections = await _context.WebsiteConnections
                    .Where(w => w.UserId == user.Id)
                    .Select(w => new
                    {
                        id = w.Id,
                        title = w.Title,
                        link = w.Link,
                        imagePath = w.ImagePath,
                        description = w.Description,
                        createdDate = w.CreatedDate,
                        isActive = w.IsActive,
                        isFeatured = w.IsFeatured,
                        gitHubLink = w.GitHubLink
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = connections });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Deletes a specific website connection
        /// </summary>
        /// <param name="id">The unique identifier of the connection to delete</param>
        /// <returns>Result of the connection deletion operation</returns>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteConnection(int id)
        {
            try
            {
                var user = await _userManager.GetUserAsync(User);
                if (user == null)
                {
                    return Unauthorized(new { success = false, message = "User not authenticated" });
                }

                var connection = await _context.WebsiteConnections.FindAsync(id);
                if (connection == null)
                {
                    return NotFound(new { success = false, message = "Connection not found" });
                }

                if (connection.UserId != user.Id)
                {
                    return Forbid(new { success = false, message = "You do not have permission to delete this connection" }.ToString());
                }

                if (!string.IsNullOrEmpty(connection.ImagePath))
                {
                    try
                    {
                        var fileName = connection.ImagePath.Split('/').Last();
                        await _blobStorageService.DeleteFileAsync(CONTAINER_NAME, fileName);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Error deleting blob: {ex.Message}");
                    }
                }

                _context.WebsiteConnections.Remove(connection);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Connection deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

    }
}