namespace DevExchange.Server.Models.Image.Category.DTO
{
    /// <summary>
    /// Represents the result of a bulk upload operation.
    /// </summary>
    public class BulkUploadResult
    {
        /// <summary>
        /// Gets or sets the total number of items processed in the bulk upload.
        /// </summary>
        public int TotalProcessed { get; set; }

        /// <summary>
        /// Gets or sets the number of successful uploads.
        /// </summary>
        public int SuccessfulUploads { get; set; }

        /// <summary>
        /// Gets or sets the number of failed uploads.
        /// </summary>
        public int FailedUploads { get; set; }

        /// <summary>
        /// Gets or sets the list of errors encountered during the bulk upload.
        /// </summary>
        public List<string>? Errors { get; set; }
    }
}
