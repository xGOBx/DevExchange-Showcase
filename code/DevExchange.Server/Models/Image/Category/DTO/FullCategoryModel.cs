using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace DevExchange.Server.Models.Image.Category.DTO
{
    /// <summary>
    /// Represents the full category model with questions and options for creation.
    /// </summary>
    public class FullCategoryModel
    {
        /// <summary>
        /// Gets or sets the name of the category.
        /// This field is required.
        /// </summary>

        [JsonPropertyName("CategoryName")]

        public required string CategoryName { get; set; }

        /// <summary>
        /// Gets or sets the list of questions for the category.
        /// </summary>

        [JsonPropertyName("Questions")]
        public List<QuestionCreateModel>? Questions { get; set; }
    }

    /// <summary>
    /// Represents a question model for creation, including question text and options.
    /// </summary>
    public class QuestionCreateModel
    {
        /// <summary>
        /// Gets or sets the key of the question.
        /// This field is required.
        /// </summary>
        [JsonPropertyName("QuestionKey")]

        public required string QuestionKey { get; set; }

        /// <summary>
        /// Gets or sets the text of the question.
        /// This field is required.
        /// </summary>
        [JsonPropertyName("QuestionText")]

        public required string QuestionText { get; set; }

        /// <summary>
        /// Gets or sets the list of options for the question.
        /// </summary>
        [JsonPropertyName("Options")]
        public List<OptionCreateModel>? Options { get; set; }
    }

    /// <summary>
    /// Represents an option model for a question, containing option text.
    /// </summary>
    public class OptionCreateModel
    {
        /// <summary>
        /// Gets or sets the text of the option.
        /// This field is required.
        /// </summary>
        [JsonPropertyName("OptionText")]

        public required string OptionText { get; set; }
    }



    public class FullCategoryDTO
    {
        [JsonPropertyName("UserId")]

        public required string UserId { get; set; }  // The User ID

        [JsonPropertyName("FullCategory")]

        public required FullCategoryModel FullCategory { get; set; }  // The full category details
    }
}
