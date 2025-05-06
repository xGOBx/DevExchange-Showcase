# LocalDocker Dev Branch

## Overview

This branch allows you to run the DevExchange application in a Docker container environment with local development capabilities. The setup includes containerized environments for the server, client, and database components.

## Features

- Run the entire DevExchange application within a containerized environment
- Application files are mounted as volume mounts for live development
- Changes to local files are immediately reflected in the container
- No need to rebuild containers after code changes
- Integrated SQL Server database
- Separate containers for frontend and backend development

## Requirements

- Docker installed on your machine
- Docker Compose (typically included with Docker Desktop)

## Tech Stack

- Backend: .NET 8 SDK
- Frontend: Node.js (v20)
- Database: Microsoft SQL Server 2022

## Getting Started

1. Clone this repository and checkout the `localdockerdev` branch
2. Navigate to the project directory
3. Run `docker-compose up` to start all containers
4. Access the application at:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Container Structure

The Docker Compose setup includes three main services:

### 1. devexchange.server

- .NET Core backend running on port 5000 (HTTP)
- Uses file watching for automatic recompilation
- Configured for development environment
- Connected to the SQL Server container

### 2. devexchange.client

- Node.js environment for frontend development
- Runs on port 3000 (mapped to container port 5713)
- Uses npm for package management and development server
- Configured to access the backend API

### 3. sql-server

- Microsoft SQL Server 2022 Express
- Accessible on port 1433
- Data persisted through Docker volumes

## Volume Mounts

The current configuration uses volume mounts to map directories from your local file system into the containers:

- Server: Root project directory mounted to `/src` in the container
- Client: `./devexchange.client` directory mounted to `/usr/src/app`
- SQL Server: Data persisted in a named volume `sql-data`
- Additional mounts for ASP.NET user secrets and HTTPS certificates

## Environment Variables

### Server Environment
- `ASPNETCORE_URLS=http://+:80` - Configures the server to listen on HTTP port 80
- `ASPNETCORE_ENVIRONMENT=Development` - Sets the application to development mode
- `DOTNET_USE_POLLING_FILE_WATCHER=1` - Enables file polling for Docker compatibility
- `RUNNING_IN_DOCKER=true` - Flag to indicate container environment
- `ASPNETCORE_DISABLESPAPROXY=true` - Disables SPA proxy since frontend runs separately

### Client Environment
- `NODE_ENV=development` - Sets the Node environment to development
- `RUNNING_IN_DOCKER=true` - Flag to indicate container environment
- `VITE_API_URL=http://localhost:5000` - API endpoint for frontend to backend communication

## Database Connection

The backend is configured to connect to SQL Server using the following connection string:
```
Server=sql-server;Database=DevExchange;User=sa;Password=YourStrongPassword!;TrustServerCertificate=True;
```

## Troubleshooting

If you encounter issues:

1. **Changes not reflected immediately**: The setup uses file watchers but sometimes they may need a manual refresh.
2. **Database connectivity issues**: Ensure SQL Server has fully started before the backend attempts to connect.
3. **Port conflicts**: Check if ports 3000, 5000, or 1433 are already in use on your machine.
4. **Container startup order**: The `depends_on` directive ensures proper startup sequence, but sometimes you may need to restart services.

## Notes

- For first-time setup, the database may need initialization
- User secrets and HTTPS certificates are mounted from the host machine
- For production deployments, consider using a different configuration