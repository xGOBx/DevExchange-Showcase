namespace DevExchange.Server.Models.Quiz
{
    public class Quiz
    {
        public int Id { get; set; }
        public int ConfigLinkId { get; set; } // Links to the Category and ImageUpload entries
        public DateTime CreatedDate { get; set; }
    }
}
