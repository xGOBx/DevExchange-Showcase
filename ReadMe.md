# DevExchange Deployment Workflow

This GitHub Actions workflow automates the deployment of the DevExchange application to Azure App Services. The workflow is triggered when a pull request to the `AzureProductionDeploy` branch is merged.

## Overview

The workflow performs the following key operations:

1. Builds and deploys the frontend React application to Azure
2. Integrates the frontend build with the backend application
3. Deploys the complete .NET backend application to Azure
4. Verifies both deployments with status checks

## Prerequisites

To use this workflow, you need:

1. **Azure Resources:**
   - An Azure subscription
   - A resource group named "RealTest" (configurable)
   - Two App Service instances:
     - Frontend app: "DevExchangeClientx" (configurable)
     - Backend app: "DevExchangeServerx" (configurable)

2. **Repository Structure:**
   - Frontend code in `code/devexchange.client/`
   - Backend code in `code/DevExchange.Server/`
   - `AzureDeploymentResources/web.config` file for the frontend configuration

3. **GitHub Secrets:**
   - `AZURE_CREDENTIALS`: Service principal credentials with deployment permissions
   - `AZURE_SUBSCRIPTION_ID`: Your Azure subscription ID

4. **GitHub Environment:**
   - An environment named "Azure" configured in your repository settings

## Setting Up Required Credentials

### AZURE_CREDENTIALS
This should be a JSON object containing Azure service principal credentials. Generate it using Azure CLI:

```bash
az ad sp create-for-rbac --name "github-action-resouces-deployment" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/{resource-group-name} \
  --sdk-auth
```

The output will look like:

```json
{
  "clientId": "...",
  "clientSecret": "...",
  "subscriptionId": "...",
  "tenantId": "...",
  "activeDirectoryEndpointUrl": "...",
  "resourceManagerEndpointUrl": "...",
  "activeDirectoryGraphResourceId": "...",
  "sqlManagementEndpointUrl": "...",
  "galleryEndpointUrl": "...",
  "managementEndpointUrl": "..."
}
```

Add this entire JSON output as a repository secret named `AZURE_CREDENTIALS`.

## Workflow Details

### Frontend Deployment
- Builds the Node.js application using npm
- Includes the web.config file for proper Azure configuration
- Zips and deploys the build to the frontend App Service
- Verifies the deployment by checking the site's HTTP status

### Backend Deployment
- Downloads the frontend build and integrates it into the backend's wwwroot folder
- Publishes the .NET application
- Deploys the complete application to the backend App Service
- Verifies the deployment through HTTP status checks

## How to Use

1. Set up the required Azure resources and GitHub secrets
2. Configure the environment variables in the workflow file if needed
3. Create a branch for your changes
4. When ready to deploy, create a pull request targeting the `AzureProductionDeploy` branch
5. Once the pull request is approved and merged, the workflow will automatically deploy both frontend and backend applications

## Troubleshooting

- The workflow includes verification steps that will fail if deployments are unsuccessful
- Deployment logs are captured for the backend application
- Both frontend and backend deployments have retry mechanisms to handle temporary issues

## Customization

You can easily change the following configuration variables in the workflow file:
- Resource group name
- App Service names
- Directory paths for frontend and backend components

This allows you to use the same workflow across different environments by simply updating these variables.