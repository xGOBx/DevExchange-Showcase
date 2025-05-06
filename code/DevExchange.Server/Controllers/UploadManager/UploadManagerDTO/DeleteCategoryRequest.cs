namespace DevExchange.Server.Controllers.UploadManager.DTO
{
    public class DeleteCategoryRequest
    {
        public string CategoryId { get; set; }  // Keep as string for flexibility, parse in the controller
    }
}
