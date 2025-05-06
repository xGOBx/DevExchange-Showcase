using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Sas;
using Microsoft.Extensions.Configuration;

namespace DevExchange.Server.Controllers.UploadManager
{

    /// <summary>
    /// Defines the contract for blob storage operations
    /// </summary>
    public interface IBlobStorageService
    {
        Task<string> UploadFileAsync(string controllerName, string containerName, string fileName, Stream fileStream);
        Task<Stream> DownloadFileAsync(string containerName, string fileName);
        Task DeleteFileAsync(string containerName, string fileName);
    }


    /// <summary>
    /// Provides implementation for blob storage operations using Azure Blob Storage
    /// </summary>
    public class BlobStorageService : IBlobStorageService
    {
        private readonly BlobServiceClient _blobServiceClient;
 
        private readonly string? _storageUri;
        private readonly string? connectionString;


        /// <summary>
        /// Initializes a new instance of the BlobStorageService
        /// </summary>
        /// <param name="configuration">Configuration to retrieve storage settings</param>
        public BlobStorageService(IConfiguration configuration)
        {
            connectionString = Environment.GetEnvironmentVariable("AzureStorage__ConnectionString");
            _blobServiceClient = new BlobServiceClient(connectionString);
            _storageUri = Environment.GetEnvironmentVariable("AzureStorage__BaseUrl");

        }

        /// <summary>
        /// Uploads a file to the specified blob container
        /// </summary>
        /// <inheritdoc/>
        public async Task<string> UploadFileAsync(string controllerName, string containerName, string fileName, Stream fileStream)
        {
            // Get container client
            var containerClient = _blobServiceClient.GetBlobContainerClient(containerName.ToLower());

            // Create container if it doesn't exist with public access
            await containerClient.CreateIfNotExistsAsync(PublicAccessType.Blob);

            // Make sure container is set to public access if it already exists
            await containerClient.SetAccessPolicyAsync(PublicAccessType.Blob);

            // Upload the file
            var blobClient = containerClient.GetBlobClient(fileName);
            await blobClient.UploadAsync(fileStream, true);

            // Return direct URL to the blob (no SAS token, permanent public access)
            return $"{_storageUri}/{containerName.ToLower()}/{fileName}";
        }

        /// <summary>
        /// Downloads a file from the specified blob container
        /// </summary>
        /// <inheritdoc/>
        public async Task<Stream> DownloadFileAsync(string containerName, string fileName)
        {
            var containerClient = _blobServiceClient.GetBlobContainerClient(containerName.ToLowerInvariant());
            var blobClient = containerClient.GetBlobClient(fileName);
            var response = await blobClient.DownloadAsync();

            // Create a new MemoryStream to hold the blob content
            var memoryStream = new MemoryStream();
            await response.Value.Content.CopyToAsync(memoryStream);
            memoryStream.Position = 0;
            return memoryStream;
        }

        /// <summary>
        /// Deletes a file from the specified blob container
        /// </summary>
        /// <inheritdoc/>
        public async Task DeleteFileAsync(string containerName, string fileName)
        {
            var containerClient = _blobServiceClient.GetBlobContainerClient(containerName.ToLower());
            var blobClient = containerClient.GetBlobClient(fileName);
            await blobClient.DeleteIfExistsAsync();
        }

    }
}