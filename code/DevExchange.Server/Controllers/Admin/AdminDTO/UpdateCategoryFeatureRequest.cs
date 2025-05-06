namespace DevExchange.Server.Controllers.Admin.AdminDTO
{
    public class UpdateCategoryFeatureRequest
    {
        public int categoryId { get; set; }
        public bool isFeatured { get; set; }
    }
}
