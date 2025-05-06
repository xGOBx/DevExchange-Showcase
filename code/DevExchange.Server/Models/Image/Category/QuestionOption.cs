using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace DevExchange.Server.Models.Image.Category
{
    /// <summary>
    /// Represents an option associated with a question in the system.
    /// </summary>
    public class QuestionOption
    {
        /// <summary>
        /// Gets or sets the unique identifier for the question option.
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Gets or sets the text of the option.
        /// </summary>
      
        public string OptionText { get; set; }

        /// <summary>
        /// Gets or sets the identifier for the question to which the option belongs.
        /// </summary>
        [ForeignKey("QuestionId")]
        [Required]
        public int QuestionId { get; set; }
    }
}
