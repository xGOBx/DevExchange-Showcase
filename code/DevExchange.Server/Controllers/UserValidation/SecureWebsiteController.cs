using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using DevExchange.Server.Models.UserValidation;
using DevExchange.Server.Data;
using Microsoft.EntityFrameworkCore;

namespace DevExchange.Server.Controllers.UserValidation
{
    [Route("api/securewebsite")]
    [ApiController]
    public class SecureWebsiteController : ControllerBase
    {

        private readonly SignInManager<User> signInManager;
        private readonly UserManager<User> userManager;
        private readonly ApplicationDbContext _context;



        /// <summary>
        /// Initializes a new instance of the <see cref="SecureWebsiteController"/> class.
        /// </summary>
        /// <param name="sm">The sign-in manager for managing user sign-ins.</param>
        /// <param name="um">The user manager for managing users.</param>
        public SecureWebsiteController(SignInManager<User> sm, UserManager<User> um, ApplicationDbContext context)
        {
            signInManager = sm;
            userManager = um;
            _context = context;
        }

        /// <summary>
        /// Registers a new user.
        /// </summary>
        /// <param name="user">The user information to register.</param>
        /// <returns>A result indicating the success or failure of registration.</returns>
        [HttpPost("register")]
        public async Task<ActionResult> RegisterUser(RegisterUserDto userDto)
        {
            IdentityResult result = new();
            try
            {
                User user_ = new User()
                {
                    Name = userDto.Name,
                    Email = userDto.Email,
                    UserName = userDto.UserName,
                    EmailConfirmed = true
                };
                result = await userManager.CreateAsync(user_, userDto.Password);
      

            }
            catch (Exception ex)
            {
                return BadRequest("Something went wrong, please try again. " + ex.Message);
            }
            return Ok(new { message = "Registered Successfully.", result });
        }

        /// <summary>
        /// Logs in a user with their credentials.
        /// </summary>
        /// <param name="login">The login credentials.</param>
        /// <returns>A result indicating the success or failure of the login.</returns>
        [HttpPost("login")]
        public async Task<ActionResult> LoginUser(Login login)
        {
            var user_ = await userManager.FindByEmailAsync(login.Email);
            if (user_ == null)
            {
                return Unauthorized(new { message = "Invalid credentials" });
            }
            var result = await signInManager.PasswordSignInAsync(user_, login.Password, login.Remember, false);
            if (!result.Succeeded)
            {
                return Unauthorized(new { message = "Invalid credentials" });
            }
            var userId = user_.Id.ToString();
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User ID not found" });
            }
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            var classificationQuizRole = await _context.Set<ClassificationQuizRole>().FindAsync(userId);
            bool isTrustedClassificationQuiz = false;

            if (classificationQuizRole != null)
            {
                isTrustedClassificationQuiz = classificationQuizRole.IsTrustedClassificationQuiz;
            }

            var webConnectRole = await _context.Set<WebConnectRole>().FindAsync(userId);
            bool isTrustedWebConnect = false;

            if (webConnectRole != null)
            {
                isTrustedWebConnect = webConnectRole.IsTrustedWebConnect;
            }

            return Ok(new
            {
                message = "Login successful",
                isAdmin = user.IsAdmin,
                isTrustedWebConnect = isTrustedWebConnect,
                isTrustedClassificationQuiz = isTrustedClassificationQuiz
            });
        }

        /// <summary>
        /// Logs out the current user and clears all session and local storage data.
        /// </summary>
        /// <returns>A result indicating the success or failure of the logout.</returns>
        [HttpGet("logout"), Authorize]
        public async Task<ActionResult> LogoutUser()
        {
            try
            {
                await signInManager.SignOutAsync();

                Response.Cookies.Delete(".AspNetCore.Identity.Application");

                foreach (var cookie in Request.Cookies.Keys)
                {
                    Response.Cookies.Delete(cookie);
                }


                return Ok(new
                {
                    message = "You are free to go!",
                    clearLocalStorage = true
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Something went wrong, please try again. " + ex.Message });
            }
        }

        /// <summary>
        /// Retrieves user information by email.
        /// </summary>
        /// <param name="email">The user's email address.</param>
        /// <returns>The user information.</returns>
        [HttpGet("home/{email}"), Authorize]
        public async Task<ActionResult> HomePage(string email)
        {
            User userInfo = await userManager.FindByEmailAsync(email);
            if (userInfo == null)
            {
                return BadRequest(new { message = "Something went wrong, please try again." });
            }

            return Ok(new { userInfo });
        }

        /// <summary>
        /// Checks if the current user is signed in.
        /// </summary>
        /// <returns>A result indicating whether the user is logged in.</returns>
        [HttpGet("xhtlekd")]
        public async Task<ActionResult> CheckUser()
        {
            User currentuser = new();

            try
            {
                var user_ = HttpContext.User;
                var principals = new ClaimsPrincipal(user_);
                var result = signInManager.IsSignedIn(principals);
                if (result)
                {
                    currentuser = await signInManager.UserManager.GetUserAsync(principals);
                }
                else
                {
                    return Forbid();
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Something went wrong please try again. " + ex.Message });
            }

            return Ok(new { message = "Logged in", user = currentuser });
        }
        [HttpGet("CheckAdmin")]
        [Authorize]
        public async Task<IActionResult> CheckAdmin()
        {
            var user = await signInManager.UserManager.GetUserAsync(User);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            // Assuming you have an IsAdmin property in your User model
            // or you're using roles (recommended)
            bool isAdmin = await userManager.IsInRoleAsync(user, "Admin");
            return Ok(new { isAdmin = isAdmin });
        }

        /// <summary>
        /// Returns the current user's ID if logged in.
        /// </summary>
        /// <returns>The user's ID or a forbidden response.</returns>
        [HttpGet("CheckUserReturnId")]
        public async Task<ActionResult> CheckUserReturnId()
        {
            try
            {
                var user_ = HttpContext.User;
                var principals = new ClaimsPrincipal(user_);
                var result = signInManager.IsSignedIn(principals);

                if (result)
                {
                    var currentuser = await signInManager.UserManager.GetUserAsync(principals);

                    if (currentuser == null)
                    {
                        return NotFound(new { message = "User not found" });
                    }

                    return Ok(new { userId = currentuser.Id });
                }
                else
                {
                    return Forbid();
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Something went wrong, please try again. " + ex.Message });
            }
        }

        /// <summary>
        /// Finds a user by their email address.
        /// </summary>
        /// <param name="email">The user's email address.</param>
        /// <returns>The user's information.</returns>
        [HttpGet("user/byemail")]
        public async Task<IActionResult> FindUserByEmailAsync([FromQuery] string email)
        {
            try
            {
                if (string.IsNullOrEmpty(email))
                {
                    return BadRequest("Email is required.");
                }

                var user = await userManager.FindByEmailAsync(email);

                if (user == null)
                {
                    return NotFound(new { message = "User not found." });
                }

                return Ok(new { userId = user.Id, email = user.Email, userName = user.UserName });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "An error occurred while retrieving the user.");
            }
        }

        [HttpGet("verify-classification-quiz")]
        public async Task<IActionResult> VerifyClassificationQuiz([FromQuery] string token)
        {
            try
            {
                // Validate input
                if (string.IsNullOrEmpty(token))
                {
                    return BadRequest("Invalid verification token");
                }

                // Find the verification entry
                var verificationEntry = await _context.ClassificationQuizVerifications
                    .FirstOrDefaultAsync(v => v.Token == token);

                // Check if verification entry exists
                if (verificationEntry == null)
                {
                    return BadRequest("Invalid or expired verification token");
                }

                // Check token expiration
                if (verificationEntry.ExpiresAt < DateTime.UtcNow)
                {
                    return BadRequest("Verification token has expired");
                }

                // Check if user already has a ClassificationQuizRole
                var user = await userManager.FindByIdAsync(verificationEntry.UserId);
                if (user == null)
                {
                    return NotFound("User not found");
                }

                // Check if user already has the role
                var existingRole = await _context.ClassificationQuizRoles
                    .FirstOrDefaultAsync(r => r.UserId == user.Id);

                if (existingRole != null)
                {
                    return Ok(new
                    {
                        message = "You have already been verified for the Classification Quiz",
                        alreadyVerified = true
                    });
                }

                // Create new ClassificationQuizRole
                var classificationQuizRole = new ClassificationQuizRole
                {
                    UserId = user.Id,
                    IsTrustedClassificationQuiz = false
                };

                _context.ClassificationQuizRoles.Add(classificationQuizRole);
                verificationEntry.VerifiedAt = DateTime.UtcNow;


                // Remove the used verification token
                _context.ClassificationQuizVerifications.Remove(verificationEntry);

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Successfully verified for Classification Quiz",
                    alreadyVerified = false
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = "An error occurred during verification",
                    details = ex.Message
                });
            }
        }


        [HttpGet("verify-web-connect")]
        public async Task<IActionResult> VerifyWebConnection([FromQuery] string token)
        {
            try
            {
                // Validate input
                if (string.IsNullOrEmpty(token))
                {
                    return BadRequest("Invalid verification token");
                }

                // Find the verification entry
                var verificationEntry = await _context.WebConnectVerifications
                    .FirstOrDefaultAsync(v => v.Token == token);

                // Check if verification entry exists
                if (verificationEntry == null)
                {
                    return BadRequest("Invalid or expired verification token");
                }

                // Check token expiration
                if (verificationEntry.ExpiresAt < DateTime.UtcNow)
                {
                    return BadRequest("Verification token has expired");
                }

                // Check if user already has a ClassificationQuizRole
                var user = await userManager.FindByIdAsync(verificationEntry.UserId);
                if (user == null)
                {
                    return NotFound("User not found");
                }

                // Check if user already has the role
                var existingRole = await _context.WebConnectRoles
                    .FirstOrDefaultAsync(r => r.UserId == user.Id);
                if (existingRole != null)
                {
                    return Ok(new
                    {
                        message = "You have already been verified for Web Connect",
                        alreadyVerified = true
                    });
                }

                var WebConnectRole = new WebConnectRole
                {
                    UserId = user.Id,
                    IsTrustedWebConnect = false
                };

                _context.WebConnectRoles.Add(WebConnectRole);
                verificationEntry.VerifiedAt = DateTime.UtcNow;


                // Remove the used verification token
                _context.WebConnectVerifications.Remove(verificationEntry);

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Successfully verified for Web Connections",
                    alreadyVerified = false
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = "An error occurred during verification",
                    details = ex.Message
                });
            }
        }
    }

}
