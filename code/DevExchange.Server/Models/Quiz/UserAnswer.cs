using DevExchange.Server.Models.Image.Category;
using DevExchange.Server.Models.UserValidation;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

/// <summary>
/// Represents an answer submitted by a user for a specific question in a category.
/// </summary>
public class UserAnswer
{
    /// <summary>
    /// Gets or sets the unique identifier for the user answer record.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Gets or sets the category ID associated with the question.
    /// </summary>
    public int CategoryId { get; set; }

    /// <summary>
    /// Gets or sets the question ID that the user answered.
    /// </summary>
    public int QuestionId { get; set; }

    /// <summary>
    /// Gets or sets the selected option ID for the question.
    /// </summary>
    public int QuestionOptionId { get; set; }

    /// <summary>
    /// Gets or sets the user ID that answered the question.
    /// </summary>
    public string UserId { get; set; }

    /// <summary>
    /// Gets or sets the category name for the question.
    /// </summary>
    public string CategoryName { get; set; }

    /// <summary>
    /// Gets or sets the image name associated with the answer.
    /// </summary>
    public string ImageName { get; set; }

    /// <summary>
    /// Gets or sets the path to the image associated with the answer.
    /// </summary>
    public string ImagePath { get; set; }

    /// <summary>
    /// Gets or sets a value indicating whether the question has been answered for this image.
    /// </summary>
    public bool IsQuestionAnswered { get; set; }

    /// <summary>
    /// Gets or sets a value indicating whether all questions are answered for this image.
    /// </summary>
    public bool IsImageAnswered { get; set; }

    /// <summary>
    /// Navigation property for the associated category.
    /// </summary>
    public CategoryModel Category { get; set; }

    /// <summary>
    /// Navigation property for the associated question.
    /// </summary>
    public Question Question { get; set; }

    /// <summary>
    /// Navigation property for the selected question option.
    /// </summary>
    public QuestionOption QuestionOption { get; set; }

    /// <summary>
    /// Navigation property for the user who answered the question.
    /// </summary>
    public User User { get; set; }

    /// <summary>
    /// Gets or sets the session ID associated with the user session.
    /// </summary>
    public string SessionId { get; set; }
    public DateTime CreatedDate { get; set; }


    /// <summary>
    /// Gets or sets the key of the question.
    /// </summary>
    [Required]
    [JsonPropertyName("QuestionKey")]
    public required string QuestionKey { get; set; }
}
