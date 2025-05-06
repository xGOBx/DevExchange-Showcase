using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace DevExchange.Server.Models.Image.Category
{
    /// <summary>
    /// Represents a category model for the system.
    /// </summary>
    public class CategoryModel
    {
        /// <summary>
        /// Gets or sets the unique identifier for the category.
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Gets or sets the name of the category.
        /// </summary>
        [Required]
        [JsonPropertyName("CategoryName")]
        public required string CategoryName { get; set; }

        /// <summary>
        /// Gets or sets the date when the category was created.
        /// Defaults to the current UTC date and time.
        /// </summary>
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Gets or sets the collection of questions related to this category.
        /// </summary>
        public ICollection<Question> Questions { get; set; }

        /// <summary>
        /// Gets or sets the identifier for the associated configuration link.
        /// </summary>
        public int ConfigLinkId { get; set; }

        /// <summary>
        /// Gets or sets the identifier for the user who created or owns the category.
        /// </summary>
        public string UserId { get; set; }

        /// <summary>
        /// Gets or sets whether the category is active.
        /// </summary>
        public bool isActive { get; set; }

        public bool isFeatured { get; set; }

    }
}
