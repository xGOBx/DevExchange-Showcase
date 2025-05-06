namespace DevExchange.Server.Models.UserValidation
{
    /// <summary>
    /// Represents a user login request containing authentication details.
    /// </summary>
    public class Login
    {
        /// <summary>
        /// Gets or sets the username for the login.
        /// </summary>
        public string? Username { get; set; }

        /// <summary>
        /// Gets or sets the email for the login.
        /// </summary>
        public string? Email { get; set; }

        /// <summary>
        /// Gets or sets the password for the login.
        /// </summary>
        public string? Password { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the login should be remembered.
        /// </summary>
        public bool Remember { get; set; } = false;
    }
}
