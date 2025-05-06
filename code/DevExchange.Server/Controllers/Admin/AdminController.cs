using DevExchange.Server.Controllers.Admin.AdminDTO;
using DevExchange.Server.Data;
using DevExchange.Server.Models.UserValidation;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace DevExchange.Server.Controllers.Admin
{
    /// <summary>
    /// Controller for administrative actions and user management
    /// </summary>
    [ApiController]
    [Route("api/Admin")]
    public class AdminController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly ApplicationDbContext _context;

        /// <summary>
        /// Constructor for AdminController
        /// </summary>
        /// <param name="userManager">User management service</param>
        /// <param name="context">Database context</param>
        public AdminController(UserManager<User> userManager, ApplicationDbContext context)
        {
            _userManager = userManager;
            _context = context;
        }

        /// <summary>
        /// Retrieves a list of all users with basic information
        /// </summary>
        /// <returns>List of users with Id, UserName, Email, CreatedDate, and IsAdmin status</returns>
        [HttpGet("GetUsers")]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _userManager.Users.Select(u => new
            {
                u.Id,
                u.UserName,
                u.Email,
                u.CreatedDate, 
                u.IsAdmin, 
            }).ToListAsync();

            return Ok(users);
        }

        /// <summary>
        /// Updates the admin status for a specific user
        /// </summary>
        /// <param name="request">Request containing user ID and desired admin status</param>
        /// <returns>Status of the admin status update</returns>
        [HttpPost("UpdateAdminStatus")]
        public async Task<IActionResult> UpdateAdminStatus([FromBody] UpdateAdminRequest request)
        {
            var user = await _userManager.FindByIdAsync(request.UserId);
            if (user == null)
            {
                return NotFound("User not found.");
            }

            user.IsAdmin = request.IsAdmin;
            await _userManager.UpdateAsync(user);

            return Ok("Admin status updated successfully.");
        }

        /// <summary>
        /// Updates the trusted web connect status for a user
        /// </summary>
        /// <param name="request">Request containing user ID and desired trusted status</param>
        /// <returns>Status of the trusted web connect status update</returns>
        [HttpPost("UpdateIsTrustedWebConnectStatus")]
        public async Task<IActionResult> UpdateIsTrustedWebConnectStatus([FromBody] UpdateTrustedRequest request)
        {
            var user = await _context.WebConnectRoles.FindAsync(request.UserId);
            if (user == null)
            {
                return NotFound("User not found.");
            }

            user.IsTrustedWebConnect = request.IsTrustedWebConnect;

            _context.WebConnectRoles.Update(user);

            await _context.SaveChangesAsync();

            return Ok("Trusted status updated successfully.");
        }

        /// <summary>
        /// Updates the trusted classification upload status for a user
        /// </summary>
        /// <param name="request">Request containing user ID and desired trusted classification status</param>
        /// <returns>Status of the trusted classification upload status update</returns>
        [HttpPost("UpdateIsTrustedClassificationUpload")]
        public async Task<IActionResult> UpdateIsTrustedClassificationUpload([FromBody] UpdateClassificationTrustedRequest request)
        {
            var user = await _context.ClassificationQuizRoles.FindAsync(request.UserId);
            if (user == null)
            {
                return NotFound("User not found.");
            }

            user.IsTrustedClassificationQuiz = request.IsTrustedClassificationQuiz;

            // Ensure the update is properly saved
            _context.ClassificationQuizRoles.Update(user);
            await _context.SaveChangesAsync();

            return Ok("Trusted status updated successfully.");
        }

        /// <summary>
        /// Checks if a specific user has admin status
        /// </summary>
        /// <param name="userId">ID of the user to check</param>
        /// <returns>Boolean indicating admin status</returns>
        [HttpGet("/{userId}")]
        public async Task<IActionResult> IsAdmin(string userId)
        {
            var user = await _context.Users
                .Where(u => u.Id == userId)
                .Select(u => u.IsAdmin) 
                .FirstOrDefaultAsync();

            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            return Ok(new { isAdmin = user }); 
        }

        /// <summary>
        /// Checks if a specific user has trusted web connect status
        /// </summary>
        /// <param name="userId">ID of the user to check</param>
        /// <returns>Boolean indicating trusted web connect status</returns>
        [HttpGet("IsTrustedWebConnect/{userId}")]
        public async Task<IActionResult> IsTrustedWebConnect(string userId)
        {
            var user = await _context.WebConnectRoles
                .Where(u => u.UserId == userId)
                .Select(u => u.IsTrustedWebConnect) 
                .FirstOrDefaultAsync();

            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            return Ok(new { IsTrustedWebConnect = user }); 
        }

        /// <summary>
        /// Checks if the currently logged-in user has admin status
        /// </summary>
        /// <returns>Boolean indicating current user's admin status</returns>
        [HttpGet("CheckAdmin")]
        public async Task<IActionResult> CheckAdmin()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null)
            {
                return Unauthorized();
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            return Ok(new { isAdmin = user.IsAdmin });
        }

        /// <summary>
        /// Checks if the currently logged-in user has trusted web connect status
        /// </summary>
        /// <returns>Boolean indicating current user's trusted web connect status</returns>
        [HttpGet("CheckIsTrustedWebConnect")]
        public async Task<IActionResult> CheckTrust()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value; 
            if (userId == null)
            {
                return Unauthorized();
            }

            var user = await _context.WebConnectRoles.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            return Ok(new { isTrustedWebConnect = user.IsTrustedWebConnect });
        }

        /// <summary>
        /// Checks if the currently logged-in user has trusted classification upload status
        /// </summary>
        /// <returns>Boolean indicating current user's trusted classification upload status</returns>
        [HttpGet("CheckIsTrustedClassificationUpload")]
        public async Task<IActionResult> CheckIsTrustedClassificationUpload()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value; 
            if (userId == null)
            {
                return Unauthorized();
            }

            var user = await _context.ClassificationQuizRoles.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            return Ok(new { isTrustedClassificationQuiz = user.IsTrustedClassificationQuiz });
        }

        /// <summary>
        /// Checks if a specific user has trusted classification upload status
        /// </summary>
        /// <param name="userId">ID of the user to check</param>
        /// <returns>Boolean indicating trusted classification upload status</returns>
        [HttpGet("IsTrustedClassificationUpload/{userId}")]
        public async Task<IActionResult> IsTrustedClassificationUpload(string userId)
        {
            var user = await _context.ClassificationQuizRoles
                .Where(u => u.UserId == userId)
                .Select(u => u.IsTrustedClassificationQuiz)
                .FirstOrDefaultAsync();

            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            return Ok(new { IsTrustedClassificationQuiz = user }); 
        }

        /// <summary>
        /// Retrieves a list of users with their classification quiz trusted status
        /// </summary>
        /// <returns>List of users with their classification quiz trusted status</returns>
        [HttpGet("GetClassificationTrustedUsers")]
        public async Task<IActionResult> GetClassificationTrustedUsers()
        {
            var users = await _context.ClassificationQuizRoles.Select(u => new
            {
                u.UserId,
                u.IsTrustedClassificationQuiz
            }).ToListAsync();

            return Ok(users);
        }

        /// <summary>
        /// Retrieves a list of users with their web connect trusted status
        /// </summary>
        /// <returns>List of users with their web connect trusted status</returns>
        [HttpGet("GetWebConnectTrustedUsers")]
        public async Task<IActionResult> GetWebConnectTrustedUsers()
        {
            var users = await _context.WebConnectRoles.Select(u => new
            {
                u.UserId,
                u.IsTrustedWebConnect
            }).ToListAsync();

            return Ok(users);
        }

        /// <summary>
        /// Creates a new classification quiz role for a user
        /// </summary>
        /// <param name="request">Request containing user ID for role creation</param>
        /// <returns>Status of the classification quiz role creation</returns>
        [HttpPost("ClassificationQuizRole/Create")]
        public async Task<IActionResult> CreateClassificationQuizRole([FromBody] CreateClassificationRoleRequest request)
        {
            var existingRole = await _context.ClassificationQuizRoles
                .FirstOrDefaultAsync(r => r.UserId == request.UserId);

            if (existingRole != null)
            {
                return StatusCode(409, new { message = "Role already exists for this user" });
            }

            // Create a new role
            var newRole = new ClassificationQuizRole
            {
                UserId = request.UserId,
                IsTrustedClassificationQuiz = false 
            };

            await _context.ClassificationQuizRoles.AddAsync(newRole);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Classification quiz role created successfully" });
        }
    }
}