namespace DevExchange.Server.Models.Quiz
{
    public class SubmitAnswerRequest
    {
        public string? UserId { get; set; }
        public string? SessionId { get; set; }
        public int QuestionId { get; set; }
        public int QuestionOptionId { get; set; }
        public string ImageName { get; set; } = string.Empty;
        public string ImagePath { get; set; } = string.Empty;
    }
}
