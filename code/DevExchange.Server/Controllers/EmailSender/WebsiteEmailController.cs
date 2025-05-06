using Azure.Communication.Email;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Azure;
using DevExchange.Server.Data;
using DevExchange.Server.Models;
using DevExchange.Server.Models.UserValidation;
using DevExchange.Server.Controllers.EmailSender.DTO;
using DevExchange.Server.Controllers.EmailSender.CustomExceptionHandler;
using System.Security.Cryptography;

namespace DevExchange.Server.Controllers
{

    public interface IWebsiteEmailService
    {
        /// <summary>
        /// Sends an email using Azure Communication Services
        /// </summary>
        /// <param name="toEmail">Recipient email address</param>
        /// <param name="subject">Email subject</param>
        /// <param name="htmlBody">HTML content of the email</param>
        /// <returns>Email send operation result</returns>
        Task<EmailSendOperation> SendEmailAsync(string toEmail, string subject, string htmlBody);

        /// <summary>
        /// Sends a confirmation email when a website connection is submitted
        /// </summary>
        /// <param name="request">Email request containing website ID</param>
        /// <returns>Action result with message and ID</returns>
        Task<IActionResult> SendSubmissionConfirmation(EmailRequest request);

        /// <summary>
        /// Sends a notification email when a website connection is approved
        /// </summary>
        /// <param name="request">Email request containing website ID</param>
        /// <returns>Action result with status message</returns>
        Task<IActionResult> SendApprovalNotification(EmailRequest request);

        /// <summary>
        /// Sends a notification email when a website connection is removed
        /// </summary>
        /// <param name="request">Email request containing website ID</param>
        /// <returns>Action result with status message</returns>
        Task<IActionResult> SendRemovalNotification(EmailRequest request);

        /// <summary>
        /// Verifies a classification quiz using the provided token
        /// </summary>
        /// <param name="token">Verification token</param>
        /// <returns>Action result with verification status</returns>
        Task<IActionResult> VerifyClassificationQuiz(string token);

        /// <summary>
        /// Sends a verification email for the classification quiz
        /// </summary>
        /// <param name="request">Email request containing user ID</param>
        /// <returns>Action result with message and status</returns>
        Task<IActionResult> SendVerificationEmail(EmailRequest request);

        /// <summary>
        /// Sends a verification email for web connect functionality
        /// </summary>
        /// <param name="request">Email request containing user ID</param>
        /// <returns>Action result with message and status</returns>
        Task<IActionResult> SendVerificationEmailWebConnect(EmailRequest request);

        /// <summary>
        /// Generates HTML content for submission confirmation emails
        /// </summary>
        /// <param name="website">Website connection model</param>
        /// <param name="user">User information</param>
        /// <returns>HTML content as string</returns>
        string GenerateSubmissionConfirmationEmail(WebsiteConnectionModel website, User user);

        /// <summary>
        /// Generates HTML content for approval notification emails
        /// </summary>
        /// <param name="website">Website connection model</param>
        /// <param name="user">User information</param>
        /// <returns>HTML content as string</returns>
        string GenerateApprovalEmail(WebsiteConnectionModel website, User user);

        /// <summary>
        /// Generates HTML content for removal notification emails
        /// </summary>
        /// <param name="website">Website connection model</param>
        /// <param name="user">User information</param>
        /// <returns>HTML content as string</returns>
        string GenerateRemovalEmail(WebsiteConnectionModel website, User user);

        /// <summary>
        /// Generates HTML content for verification emails
        /// </summary>
        /// <param name="user">User information</param>
        /// <param name="verificationLink">Verification link URL</param>
        /// <returns>HTML content as string</returns>
        string GenerateVerificationEmail(User user, string verificationLink);

        /// <summary>
        /// Generates HTML content for web connect verification emails
        /// </summary>
        /// <param name="user">User information</param>
        /// <param name="verificationLink">Verification link URL</param>
        /// <returns>HTML content as string</returns>
        string GenerateVerificationEmailWebConnect(User user, string verificationLink);

        /// <summary>
        /// Generates a cryptographically secure random token for verification
        /// </summary>
        /// <returns>A URL-safe Base64 encoded string</returns>
        string GenerateVerificationToken();
    }
    [ApiController]
    [Route("api/[controller]")]
    public class WebsiteEmailController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly EmailClient _emailClient;
        private readonly string _senderAddress;
        private readonly ILogger<WebsiteEmailController> _logger;
        private readonly IConfiguration _configuration;
        private readonly UserManager<User> _userManager;

        public WebsiteEmailController(
            ApplicationDbContext context,
            IConfiguration configuration,
            ILogger<WebsiteEmailController> logger,
            UserManager<User> userManager)
        {
            _context = context;
            _configuration = configuration;
            _logger = logger;
            _userManager = userManager;
            var connectionString = Environment.GetEnvironmentVariable("AzureCommunicationServices__ConnectionString")
                ?? throw new InvalidOperationException("Azure Communication Services connection string not found");
            _senderAddress = Environment.GetEnvironmentVariable("AzureCommunicationServices__SenderEmail")
                ?? throw new InvalidOperationException("Sender email address not configured");
            _emailClient = new EmailClient(connectionString);
        }


        /// <summary>Sends an email asynchronously with the given parameters.</summary>
        /// <param name="toEmail">The recipient's email address.</param>
        /// <param name="subject">The email subject.</param>
        /// <param name="htmlBody">The HTML content of the email.</param>
        /// <returns>An EmailSendOperation representing the email sending process.</returns>
        private async Task<EmailSendOperation> SendEmailAsync(string toEmail, string subject, string htmlBody)
        {
            try
            {
                var emailMessage = new EmailMessage(
                    senderAddress: _senderAddress,
                    content: new EmailContent(subject)
                    {
                        PlainText = "This is a plaintext version of the email.",
                        Html = htmlBody
                    },
                    recipients: new EmailRecipients(new List<EmailAddress> { new EmailAddress(toEmail) })
                );

                // Change from WaitUntil.Started to WaitUntil.Completed
                var response = await _emailClient.SendAsync(
                    WaitUntil.Completed,
                    emailMessage);

                _logger.LogInformation("Email sent successfully to {Email}. MessageId: {MessageId}",
                    toEmail, response.Id);

                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to {Email}", toEmail);
                throw new EmailSendException($"Failed to send email to {toEmail}", ex);
            }

        }

        /// <summary>Sends a submission confirmation email to the user.</summary>
        /// <param name="request">The email request containing website information.</param>
        /// <returns>An IActionResult indicating the email sending status.</returns>
        [HttpPost("sendSubmissionConfirmation")]
        public async Task<IActionResult> SendSubmissionConfirmation([FromBody] EmailRequest request)
        {
            try
            {
                var website = await _context.WebsiteConnections
                    .FirstOrDefaultAsync(w => w.Id == request.WebsiteId);

                if (website == null)
                {
                    return NotFound("Website not found");
                }

                var user = await _userManager.FindByIdAsync(website.UserId);
                if (user == null)
                {
                    return NotFound("User not found");
                }

                var htmlBody = GenerateSubmissionConfirmationEmail(website, user);
                var emailOperation = await SendEmailAsync(user.Email, "Website Connection Submission Received", htmlBody);

                return Ok(new
                {
                    message = "Confirmation email sent successfully",
                    messageId = emailOperation.Id
                });
            }
            catch (EmailSendException ex)
            {
                _logger.LogError(ex, "Failed to send submission confirmation email: {Message}", ex.Message);
                return StatusCode(500, new { error = ex.Message });
            }
        }


        /// <summary>Sends an approval notification email to the user.</summary>
        /// <param name="request">The email request containing website information.</param>
        /// <returns>An IActionResult indicating the email sending status.</returns>
        [HttpPost("sendApprovalNotification")]
        public async Task<IActionResult> SendApprovalNotification([FromBody] EmailRequest request)
        {
            try
            {
                var website = await _context.WebsiteConnections
                    .FirstOrDefaultAsync(w => w.Id == request.WebsiteId);

                if (website == null)
                {
                    return NotFound("Website not found");
                }

                var user = await _userManager.FindByIdAsync(website.UserId);
                if (user == null)
                {
                    return NotFound("User not found");
                }

                var htmlBody = GenerateApprovalEmail(website, user);
                await SendEmailAsync(user.Email, "Website Connection Approved", htmlBody);

                return Ok(new { message = "Approval notification sent successfully" });
            }
            catch (EmailSendException ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>Sends a removal notification email to the user.</summary>
        /// <param name="request">The email request containing website information.</param>
        /// <returns>An IActionResult indicating the email sending status.</returns>
        [HttpPost("sendRemovalNotification")]
        public async Task<IActionResult> SendRemovalNotification([FromBody] EmailRequest request)
        {
            try
            {
                var website = await _context.WebsiteConnections
                    .FirstOrDefaultAsync(w => w.Id == request.WebsiteId);

                if (website == null)
                {
                    return NotFound("Website not found");
                }

                var user = await _userManager.FindByIdAsync(website.UserId);
                if (user == null)
                {
                    return NotFound("User not found");
                }

                var htmlBody = GenerateRemovalEmail(website, user);
                await SendEmailAsync(user.Email, "Website Connection Removed", htmlBody);

                return Ok(new { message = "Removal notification sent successfully" });
            }
            catch (EmailSendException ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>Generates an HTML email body for submission confirmation.</summary>
        /// <param name="website">The website connection model.</param>
        /// <param name="user">The user associated with the website.</param>
        /// <returns>A string containing the HTML email body.</returns>
        public static string GenerateSubmissionConfirmationEmail(WebsiteConnectionModel website, User user)
        {
            return $@"
                <h2>Website Connection Submission Received</h2>
                <p>Dear {user.UserName},</p>
                <p>We have received your website connection submission for <strong>{website.Title}</strong>.</p>
                <p>Your submission is currently under review by our team. We will notify you once the review is complete.</p>
                <p>Review details:</p>
                <ul>
                    <li>Website Title: {website.Title}</li>
                    <li>Submission Date: {DateTime.UtcNow:MMMM dd, yyyy}</li>
                </ul>
                <p>Thank you for your patience during the review process.</p>
                <p>Best regards,<br>Your Website Team</p>";
        }

        private static string GenerateApprovalEmail(WebsiteConnectionModel website, User user)
        {
            return $@"
                <h2>Website Connection Approved!</h2>
                <p>Dear {user.UserName},</p>
                <p>We're pleased to inform you that your website connection for <strong>{website.Title}</strong> has been approved and is now live on our platform.</p>
                <p>Details:</p>
                <ul>
                    <li>Website Title: {website.Title}</li>
                    <li>Approval Date: {DateTime.UtcNow:MMMM dd, yyyy}</li>
                    <li>Status: Active</li>
                </ul>
                <p>Thank you for contributing to our platform!</p>
                <p>Best regards,<br>Your Website Team</p>";
        }

        private static string GenerateRemovalEmail(WebsiteConnectionModel website, User user)
        {
            return $@"
                <h2>Website Connection Status Update</h2>
                <p>Dear {user.UserName},</p>
                <p>We regret to inform you that your website connection for <strong>{website.Title}</strong> has been removed from our platform for undisclosed reasons.</p>
                <p>Details:</p>
                <ul>
                    <li>Website Title: {website.Title}</li>
                    <li>Removal Date: {DateTime.UtcNow:MMMM dd, yyyy}</li>
                </ul>
                <p>If you have any questions about this decision, please contact our support team.</p>
                <p>Best regards,<br>Your Website Team</p>";
        }

        /// <summary>Verifies the classification quiz using a provided token.</summary>
        /// <param name="token">The verification token.</param>
        /// <returns>An IActionResult indicating the verification status.</returns>
        [HttpGet("verifyClassificationQuiz")]
        public async Task<IActionResult> VerifyClassificationQuiz([FromQuery] string token)
        {
            try
            {
                // Find the verification entry
                var verificationEntry = await _context.ClassificationQuizVerifications
                    .FirstOrDefaultAsync(v => v.Token == token && v.ExpiresAt > DateTime.UtcNow);

                if (verificationEntry == null)
                {
                    return BadRequest("Invalid or expired verification token");
                }

                // Find the user
                var user = await _userManager.FindByIdAsync(verificationEntry.UserId);
                if (user == null)
                {
                    return NotFound("User not found");
                }

                // Create ClassificationQuizRole
                var classificationQuizRole = new ClassificationQuizRole
                {
                    UserId = user.Id,
                    IsTrustedClassificationQuiz = false
                };

                _context.ClassificationQuizRoles.Add(classificationQuizRole);

                // Remove the verification entry
                _context.ClassificationQuizVerifications.Remove(verificationEntry);

                await _context.SaveChangesAsync();

                return Ok(new { message = "Classification Quiz verification successful" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Verification failed: {Message}", ex.Message);
                return StatusCode(500, new { error = "Verification process failed" });
            }
        }

        // <summary>Generates an HTML email body for verification.</summary>
        /// <param name="user">The user to send the verification email to.</param>
        /// <param name="verificationLink">The verification link.</param>
        /// <returns>A string containing the HTML email body.</returns>
        private static string GenerateVerificationEmail(User user, string verificationLink)
        {
            return $@"
                <h2>Verify Your Classification Quiz</h2>
                <p>Dear {user.UserName},</p>
                <p>To complete your Classification Quiz verification, please click the link below:</p>
                <p><a href=""{verificationLink}"">Verify Classification Quiz</a></p>
                <p>This link will expire in 24 hours.</p>
                <p>If you did not request this verification, please ignore this email.</p>
                <p>Best regards,<br>Your Website Team</p>";
        }


        /// <summary>Generates a cryptographically strong verification token.</summary>
        /// <returns>A string representing the verification token.</returns>
        private static string GenerateVerificationToken()
        {
            // Generate a cryptographically strong random token
            byte[] tokenData = new byte[32];
            using (var rng = new RNGCryptoServiceProvider())
            {
                rng.GetBytes(tokenData);
            }
            return Convert.ToBase64String(tokenData)
                .Replace("+", "-")
                .Replace("/", "_")
                .Replace("=", "");
        }

        /// <summary>Sends a verification email for web connection.</summary>
        /// <param name="request">The email request containing user information.</param>
        /// <returns>An IActionResult indicating the email sending status.</returns>
        [HttpPost("sendVerificationEmailWebConnect")]
        public async Task<IActionResult> SendVerificationEmailWebConnect([FromBody] EmailRequest request)
        {
            try
            {
                // Validate input
                if (request == null || string.IsNullOrEmpty(request.UserId))
                {
                    return BadRequest("Invalid user ID");
                }
                var user = await _userManager.FindByIdAsync(request.UserId);
                if (user == null)
                {
                    return NotFound("User not found");
                }

                // Check if user already has a ClassificationQuizRole
                var existingRole = await _context.WebConnectVerifications
                    .FirstOrDefaultAsync(r => r.UserId == user.Id);

                if (existingRole != null)
                {
                    return Ok(new
                    {
                        message = "You have already a Verification request pending Approval",
                        alreadyVerified = true
                    });
                }

                // Check for existing valid verification token
                var existingVerification = await _context.WebConnectVerifications
                    .FirstOrDefaultAsync(v =>
                        v.UserId == user.Id &&
                        v.ExpiresAt > DateTime.UtcNow &&
                        v.VerifiedAt == null);

                if (existingVerification != null)
                {
                    // Calculate remaining time for the existing token
                    var remainingTime = existingVerification.ExpiresAt - DateTime.UtcNow;
                    return Ok(new
                    {
                        message = "Verification token already exists",
                        expiresIn = $"{remainingTime.Hours} hours and {remainingTime.Minutes} minutes"
                    });
                }

                // Generate a unique verification token
                string verificationToken = GenerateVerificationToken();

                // Store the new verification token in the database
                var verificationEntry = new WebConnectVerification
                {
                    UserId = user.Id,
                    Token = verificationToken,
                    CreatedAt = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddHours(24) // Token expires in 24 hours
                };

                _context.WebConnectVerifications.Add(verificationEntry);
                await _context.SaveChangesAsync();

                var frontendUrl = Environment.GetEnvironmentVariable("WEB_URL")
                    ?? throw new InvalidOperationException("WEB_URL environment variable not configured");


                var verificationLink = $"{frontendUrl}/verify-web-connect?token={verificationToken}";

                // Send verification email
                var htmlBody = GenerateVerificationEmailWebConnect(user, verificationLink);
                var emailOperation = await SendEmailAsync(user.Email, "Verify Your Web Connect", htmlBody);

                return Ok(new
                {
                    message = "Verification email sent successfully",
                    messageId = emailOperation.Id
                });
            }
            catch (Exception ex)
            {
                // Log the full exception details
                _logger.LogError(ex, "Detailed error in SendVerificationEmailWebConnect: {Message}, StackTrace: {StackTrace}",
                    ex.Message, ex.StackTrace);

                // If it's an inner exception, log that too
                if (ex.InnerException != null)
                {
                    _logger.LogError(ex.InnerException, "Inner Exception Details: {Message}", ex.InnerException.Message);
                }

                return StatusCode(500, new
                {
                    error = "Failed to send verification email",
                    details = ex.Message
                });
            }
        }

        /// <summary>Sends a verification email for classification quiz.</summary>
        /// <param name="request">The email request containing user information.</param>
        /// <returns>An IActionResult indicating the email sending status.</returns>
        [HttpPost("sendVerificationEmail")]
        public async Task<IActionResult> SendVerificationEmail([FromBody] EmailRequest request)
        {
            try
            {
                // Validate input
                if (request == null || string.IsNullOrEmpty(request.UserId))
                {
                    return BadRequest("Invalid user ID");
                }
                var user = await _userManager.FindByIdAsync(request.UserId);
                if (user == null)
                {
                    return NotFound("User not found");
                }

                // Check for existing valid verification token
                var existingVerification = await _context.ClassificationQuizVerifications
                    .FirstOrDefaultAsync(v =>
                        v.UserId == user.Id &&
                        v.ExpiresAt > DateTime.UtcNow &&
                        v.VerifiedAt == null);

                // Check if user already has a ClassificationQuizRole
                var existingRole = await _context.ClassificationQuizRoles
                    .FirstOrDefaultAsync(r => r.UserId == user.Id);

                if (existingRole != null)
                {
                    return Ok(new
                    {
                        message = "You have already a Verification request pending Approval",
                        alreadyVerified = true
                    });
                }

                if (existingVerification != null)
                {
                    // Calculate remaining time for the existing token
                    var remainingTime = existingVerification.ExpiresAt - DateTime.UtcNow;
                    return Ok(new
                    {
                        message = "Verification token already exists",
                        expiresIn = $"{remainingTime.Hours} hours and {remainingTime.Minutes} minutes"
                    });
                }

                // Generate a unique verification token
                string verificationToken = GenerateVerificationToken();

                // Store the new verification token in the database
                var verificationEntry = new ClassificationQuizVerification
                {
                    UserId = user.Id,
                    Token = verificationToken,
                    CreatedAt = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddHours(24) // Token expires in 24 hours
                };

                _context.ClassificationQuizVerifications.Add(verificationEntry);
                await _context.SaveChangesAsync();

                var frontendUrl = Environment.GetEnvironmentVariable("WEB_URL")
                    ?? throw new InvalidOperationException("WEB_URL environment variable not configured");

                var verificationLink = $"{frontendUrl}/verify-classification-quiz?token={verificationToken}";
                // Send verification email
                var htmlBody = GenerateVerificationEmail(user, verificationLink);
                var emailOperation = await SendEmailAsync(user.Email, "Verify Your Classification Quiz", htmlBody);

                return Ok(new
                {
                    message = "Verification email sent successfully",
                    messageId = emailOperation.Id
                });
            }
            catch (Exception ex)
            {
                // Log the full exception details
                _logger.LogError(ex, "Detailed error in SendVerificationEmail: {Message}, StackTrace: {StackTrace}",
                    ex.Message, ex.StackTrace);

                // If it's an inner exception, log that too
                if (ex.InnerException != null)
                {
                    _logger.LogError(ex.InnerException, "Inner Exception Details: {Message}", ex.InnerException.Message);
                }

                return StatusCode(500, new
                {
                    error = "Failed to send verification email",
                    details = ex.Message
                });
            }
        }

        /// <summary>Generates an HTML email body for web connection verification.</summary>
        /// <param name="user">The user to send the verification email to.</param>
        /// <param name="verificationLink">The verification link.</param>
        /// <returns>A string containing the HTML email body.</returns>
        private static string GenerateVerificationEmailWebConnect(User user, string verificationLink)
        {
            return $@"
                <h2>Verify Your Account</h2>
                <p>Dear {user.UserName},</p>
                <p>To complete your Web/Program Connection verification, please click the link below:</p>
                <p><a href=""{verificationLink}"">Verify Web Connection</a></p>
                <p>This link will expire in 24 hours.</p>
                <p>If you did not request this verification, please ignore this email.</p>
                <p>Best regards,<br>Your Website Team</p>";
        }

    }

}