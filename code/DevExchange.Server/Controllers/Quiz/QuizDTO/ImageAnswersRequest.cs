using System.ComponentModel.DataAnnotations;

namespace DevExchange.Server.Controllers.Quiz.QuizDTO
{
    public class ImageAnswersRequest
    {
        [Required]
        public string ImageName { get; set; }

        [Required]
        public string ImagePath { get; set; }

        [Required]
        [Range(1, int.MaxValue)]
        public int CategoryId { get; set; }

        [Required]
        [MinLength(1)]
        public List<AnswerSubmission> Answers { get; set; }
    }
}
