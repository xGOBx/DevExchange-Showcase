namespace DevExchange.Server.Controllers.UploadManager.DTO
{
    public class DeleteImageRequest
    {
        public string ContainerName { get; set; }
        public string FileName { get; set; }
        public int ImageId { get; set; }
    }
}
