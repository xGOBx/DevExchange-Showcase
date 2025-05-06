

namespace DevExchange.Server.Models.Image
{
    /// <summary>
    /// Represents the model for uploading an image with associated metadata.
    /// </summary>
    public class ImageUploadModel
    {
        /// <summary>
        /// Gets or sets the unique identifier for the image upload.
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Gets or sets the folder name where the image will be stored.
        /// </summary>
        public string FolderName { get; set; }

        /// <summary>
        /// Gets or sets the name of the uploaded image.
        /// </summary>
        public required string ImageName { get; set; }

        /// <summary>
        /// Gets or sets the file path where the image is stored.
        /// </summary>
        public string ImagePath { get; set; }

        /// <summary>
        /// Gets or sets the date and time when the image was created.
        /// </summary>
        public DateTime CreatedDate { get; set; }

        /// <summary>
        /// Gets or sets the configuration link identifier associated with the image.
        /// </summary>
        public int ConfigLinkId { get; set; }

        /// <summary>
        /// Gets or sets the group identifier associated with the image.
        /// </summary>
        public int GroupId { get; set; }

        /// <summary>
        /// Gets or sets the user identifier who uploaded the image.
        /// </summary>
        public string UserId { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the image is active or not.
        /// </summary>
        public bool isActive { get; set; }
    }
}
