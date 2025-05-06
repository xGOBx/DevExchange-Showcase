# Azure Project Import and Deployment Guide

This guide walks you through the process of importing and deploying the project in Azure, including database setup and application deployment.

## Table of Contents
- [Step 1: Import Project into Azure](#step-1-import-project-into-azure)
- [Step 2: Upload Database Schema](#step-2-upload-database-schema)
- [Step 3: Deploy API Code](#step-3-deploy-api-code)
- [Step 4: Deploy Frontend](#step-4-deploy-frontend)
- [Optional: Add Container Images](#optional-add-container-images)


## Azure Project Deployment Guide Video

<a href="https://drive.google.com/file/d/15tuCsOEIq60dBCT-kdpJgfFRt3qaKYTO/preview">
   <img src="./ReadMeImages/vidicon.PNG" alt="Video Tutorial" width="640" height="360">
</a>

## Step 1: Import Project into Azure

1. Search for and create a new resource group with a name of your choice
   
2. Search for "deploy custom template" in the search bar

3. Select "Build your own template in the editor"
   

4. Load file and choose the template provided "AzureDeploymentResources/AzureResourceGroupTemplate/template.json"
   
5. Modify field names as needed if your chosen ones are taken or replace values specific to your account

6. Click "Deploy"
   
   > **Note:** The deployment will initially fail as some Azure-specific features have not been implemented - this is expected behavior.

7. Once deployment has completed (with expected failure), navigate to the resource group you created to view all project resources


8.  You now have all the current resources created in the project, but we still need to populate those resources, as Azure does not extract the data for certain resources when exporting/importing.

## Step 2: Upload Database Schema

1. Open SQL Server Management Studio (SSMS)

2. Connect to your Azure database server using:
   - Server name: `{servername}.database.windows.net`
   - Enter the provided login credentials
   
   ![SSMS Connection](./ReadMeImages/DBconnect.png)

3. Once connected, navigate to the database section

4. You'll see an existing database on the server which you can delete/drop

5. Right-click on the database folder to open options

6. Click on "Tasks" and select "Import Data-Tier Application"
   
7. Import the provided database schema "DevExchangeDatabase"

## Step 3: Deploy API Code

1. Locate the API host server (App Service) in your resource group

   ![Server app service](./ReadMeImages/server.png)


2. Download the publish profile from this App Service (you will use this later)
   
   ![Download Publish Profile](./ReadMeImages/publish.png)

     ![Download Publish Profile](./ReadMeImages/strings.png)

3. Before deployment, update the following in the `appsettings.json` file:
   * **Connection string for the database**
      * ![Database Azure](./ReadMeImages/databaseazure.PNG)


      * Navigate to Settings → Connection strings
      * ADO.NET (SQL authentication)


   * **Connection string for the email service**
      * ![email service](./ReadMeImages/emailservice.PNG)

      * Navigate to **Settings → Keys**
      * Retrieve the connection string
      * You will also need to set the `SenderEmail` value to `"donotreply@{replace-with-your-subscription-key}.azurecomm.net"`


   * **Connection string and key for the storage account**
      * ![StorageAcc](./ReadMeImages/StorageAcc.PNG)


      * Go to **Security + Networking → Access Keys**
      * Retrieve the **storage account name, key, and connection string**

4. Replace the production origins with your URLs





   Example appsettings.json:

   ```json
   {
     "AllowedHosts": "*",
     "AzureCommunicationServices": {
       "ConnectionString": "endpoint=https://youremailservername.unitedstates.communication.azure.com/;accesskey=dadadadda78uJ3dvpDdvSHadadadad4mqs2JQddddQJ99BBACUadadadaadad1c6z",
       "SenderEmail": "donotreply@your-subscription-key.azurecomm.net"
     },
     "AzureStorage": {
       "ConnectionString": "DefaultEndpointsProtocol=https;AccountName=yourstorageaccountname;AccountKey=daadadadadadadadadadaddadaadadwa+AStKlOExg==;EndpointSuffix=core.windows.net",
       "BaseUrl": "https://yourstorageaccountname.blob.core.windows.net",
       "AccountName": "yourstorageaccountname",
       "AccountKey": "adadadadadadadadadadadad+dptwfDyWYQNdadadadauntovDDqVEdaaStKlOExg=="
     },
     "ConnectionStrings": {
       "DefaultConnection": "Server=tcp:devxserverdb.database.windows.net,1433;Initial Catalog=DevExchangeDatabase;Persist Security Info=False;User ID=Invincible;Password=yourpassword;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;",
       "LocalConnection": "Data Source=(localdb)\\MSSQLLocalDB;Initial Catalog=DevExchangeDatabase;Integrated Security=True;Connect Timeout=30;Encrypt=False;Trust Server Certificate=False;Application Intent=ReadWrite;Multi Subnet Failover=False"
     },
     "Cors": {
       "DevelopmentOrigins": [
         "https://localhost:5173"
       ],
       "ProductionOrigins": [
         "https://yourapiservername.azurewebsites.net",
         "https://yourclientname-htbqdpbgftfaaqcf.canadacentral-01.azurewebsites.net",
         "https://storageaccountname.blob.core.windows.net"
       ]
     },
     "Logging": {
       "LogLevel": {
         "Default": "Information",
         "Microsoft.AspNetCore": "Warning"
       }
     }
   }
   

7. Right-click on `devexchange.server`

8. Select "Publish"

9. Create a new publish profile by importing the publish settings you downloaded earlier
   
      * ![import publish](./ReadMeImages/importpublish.PNG)

10. Click "Publish" to complete the deployment


## Step 4: Deploy Frontend
  1. Navigate to the `.env` file in `devexchange.client`

  2. Update the `VITE_API_URL` value with your site server URL

      * VITE_API_URL=https://yourapiservername.azurewebsites.net

  3. Navigate to your dev exchange client directory in CMD and run `npm run build`, then get the files from the dist folder as well as AzureDeploymentResources/AzureResourceGroupTemplate/web.config

  4. In your resource group, go to your client resource

  5. Navigate to Development tools, then Advanced tools

  # ![Advanced Tools](./ReadMeImages/advancetools.PNG)

  6. This will take you to Kudu. At the top, alick on Debug console → CMD

  7. Click on the site folder, then wwwroot folder

  8. Delete "hostingstart.html"

  9. Drag and drop the files from the dist folder and the web.config

## Optional: Add Container Images

There will be no images in the container folder in the storage account initially. These images aren't essential but can be used to view test data already created in the database.

To add these images:

1. Navigate to your storage account

2. Go to Data storage, then Containers
   

3. Click the "cats" container

4. Click "Upload"

5. Drag and drop the image files from the "AzureDeploymentResources/AzureResourceGroupTemplate/Container Images" folder from the repo, matching the corresponding folder names
  

6. Repeat this process for each container folder