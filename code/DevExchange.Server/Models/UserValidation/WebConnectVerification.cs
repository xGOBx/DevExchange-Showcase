namespace DevExchange.Server.Models.UserValidation
{
    public class WebConnectVerification
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public string Token { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime ExpiresAt { get; set; }
        public DateTime? VerifiedAt { get; set; }
    }
}
