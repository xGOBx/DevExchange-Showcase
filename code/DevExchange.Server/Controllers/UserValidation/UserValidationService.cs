using DevExchange.Server.Data;
using DevExchange.Server.Models.UserValidation;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;

namespace DevExchange.Server.Controllers.UserValidation
{
    /// <summary>
    /// Service for user validation purposes.
    /// </summary>
    public class UserValidationService : IUserValidationService
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<User> _userManager;
        private readonly IHttpContextAccessor _httpContextAccessor;

        /// <summary>
        /// Initializes a new instance of the <see cref="UserValidationService"/> class.
        /// </summary>
        /// <param name="context">The application database context.</param>
        /// <param name="userManager">The user manager for managing users.</param>
        /// <param name="httpContextAccessor">The HTTP context accessor for getting user claims.</param>
        /// <param name="signInManager">The sign-in manager for handling user sign-ins.</param>
        public UserValidationService(ApplicationDbContext context, UserManager<User> userManager, IHttpContextAccessor httpContextAccessor, SignInManager<User> signInManager)
        {
            _context = context;
            _userManager = userManager;
            _httpContextAccessor = httpContextAccessor;
        }

        /// <summary>
        /// Validates the user by checking their identity in the claims and database.
        /// </summary>
        /// <returns>A tuple indicating whether the user is authorized, their user ID, and an error message if any.</returns>
        public async Task<(bool isAuthorized, string userId, string errorMessage)> ValidateUser()
        {
            var userId = _httpContextAccessor.HttpContext.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return (false, null, "User not found in claims.");

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return (false, null, "User not found.");

            return (true, userId, null);
        }

        /// <summary>
        /// Retrieves the current user's ID from the claims.
        /// </summary>
        /// <returns>The current user's ID, or null if not found.</returns>
        public string GetCurrentUserId()
        {
            var userId = _httpContextAccessor.HttpContext.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return userId;
        }
    }
}
