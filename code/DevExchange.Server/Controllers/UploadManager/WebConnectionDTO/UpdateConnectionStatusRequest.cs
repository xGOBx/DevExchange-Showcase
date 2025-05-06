namespace DevExchange.Server.Controllers.UploadManager.WebConnectionDTO
{
    public class UpdateConnectionStatusRequest
    {
        public int ConnectionId { get; set; }
        public bool IsActive { get; set; }
    }
}
