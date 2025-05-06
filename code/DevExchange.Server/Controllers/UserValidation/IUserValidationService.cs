
namespace DevExchange.Server.Controllers.UserValidation
{
    /// <summary>
    /// Interface for user validation services.
    /// </summary>
    public interface IUserValidationService
    {
        /// <summary>
        /// Validates the current user.
        /// </summary>
        /// <returns>
        /// A tuple containing a boolean indicating whether the user is authorized, 
        /// the user's ID, and an error message if the validation fails.
        /// </returns>
        Task<(bool isAuthorized, string userId, string errorMessage)> ValidateUser();

        /// <summary>
        /// Gets the current user's ID.
        /// </summary>
        /// <returns>The user's ID.</returns>
        string GetCurrentUserId();
    }
}
