namespace DevExchange.Server.Models
{
    public class WebsiteConnectionModel
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Link { get; set; }
        public string ImagePath { get; set; }
        public string UserId { get; set; }
        public DateTime CreatedDate { get; set; }
        public bool IsActive { get; set; }
        public string Description { get; set; }

        public bool IsFeatured { get; set; }

        public string GitHubLink { get; set; }



    }
}