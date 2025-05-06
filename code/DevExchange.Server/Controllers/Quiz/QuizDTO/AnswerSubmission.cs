using System.ComponentModel.DataAnnotations;

namespace DevExchange.Server.Controllers.Quiz.QuizDTO
{
    public class AnswerSubmission
    {
        [Required]
        [Range(1, int.MaxValue)]
        public int QuestionId { get; set; }

        [Required]
        [Range(1, int.MaxValue)]
        public int OptionId { get; set; }
    }
}
