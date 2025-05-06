using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace DevExchange.Server.Models.Image.Category
{
    /// <summary>
    /// Represents a question in the system.
    /// </summary>
    public class Question
    {
        /// <summary>
        /// Gets or sets the unique identifier for the question.
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Gets or sets the key of the question.
        /// </summary>
        [JsonPropertyName("QuestionKey")]
        public required string QuestionKey { get; set; }

        /// <summary>
        /// Gets or sets the text of the question.
        /// </summary>
        [JsonPropertyName("QuestionText")]
        public required string QuestionText { get; set; }

        /// <summary>
        /// Gets or sets the identifier for the category to which the question belongs.
        /// </summary>
        public int CategoryId { get; set; }

        /// <summary>
        /// Gets or sets the category associated with this question.
        /// </summary>
        [ForeignKey("CategoryId")]
        [JsonIgnore] // Ignore this property during serialization
        public CategoryModel Category { get; set; }

        /// <summary>
        /// Gets or sets the collection of options associated with the question.
        /// </summary>
        public ICollection<QuestionOption> Options { get; set; }
    }
}
