using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace DevExchange.Server.Models.Image.Category.DTO
{
    /// <summary>
    /// Represents the model for uploading a category with additional information and data.
    /// </summary>
    public class UploadModel
    {
        /// <summary>
        /// Gets or sets the name of the category.
        /// This field is required.
        /// </summary>
        [JsonPropertyName("Category")]
        public string Category { get; set; }

        /// <summary>
        /// Gets or sets the note related to the category.
        /// This field is optional.
        /// </summary>
        [JsonPropertyName("Note")]
        public string Note { get; set; }

        /// <summary>
        /// Gets or sets the associated data for the category.
        /// This field is required.
        /// </summary>
        [JsonPropertyName("Data")]

        public object Data { get; set; }
    }
}
