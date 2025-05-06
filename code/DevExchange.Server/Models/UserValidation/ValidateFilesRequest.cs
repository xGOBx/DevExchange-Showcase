namespace DevExchange.Server.Models.UserValidation
{
    /// <summary>
    /// Represents a request to validate files based on their names.
    /// </summary>
    public class ValidateFilesRequest
    {
        /// <summary>
        /// Gets or sets the list of file names to be validated.
        /// </summary>
        public List<string> FileNames { get; set; } = new List<string>();
    }
}
