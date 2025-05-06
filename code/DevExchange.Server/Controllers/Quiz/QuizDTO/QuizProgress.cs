namespace DevExchange.Server.Controllers.Quiz.QuizDTO
{

    public class QuizProgress
    {
        public int ImageIndex { get; set; }
        public Dictionary<int, int> Answers { get; set; }
        public int CategoryId { get; set; }
        public string LastSaved { get; set; }
    }
}
