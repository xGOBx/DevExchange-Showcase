import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import plugin from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { env } from 'process';

// Determine if running in Docker
const isDocker = process.env.NODE_ENV === 'development' && process.env.RUNNING_IN_DOCKER === 'true';

let httpsConfig = undefined;

// Only try to set up HTTPS if not in Docker
if (!isDocker) {
    const baseFolder =
        env.APPDATA !== undefined && env.APPDATA !== ''
            ? `${env.APPDATA}/ASP.NET/https`
            : `${env.HOME}/.aspnet/https`;
    const certificateName = "devexchange.client";
    const certFilePath = path.join(baseFolder, `${certificateName}.pem`);
    const keyFilePath = path.join(baseFolder, `${certificateName}.key`);

    // Only setup HTTPS if certificates exist or can be created
    if (fs.existsSync(certFilePath) && fs.existsSync(keyFilePath)) {
        httpsConfig = {
            key: fs.readFileSync(keyFilePath),
            cert: fs.readFileSync(certFilePath),
        };
    }
}

const target = env.ASPNETCORE_HTTPS_PORT ? `https://localhost:${env.ASPNETCORE_HTTPS_PORT}` :
    env.ASPNETCORE_URLS ? env.ASPNETCORE_URLS.split(';')[0] : 'https://localhost:5001';

export default defineConfig({
    plugins: [plugin()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    server: {
        proxy: {
            '^/home': {
                target,
                secure: false
            },
            // Add proxy for API routes if needed
            '^/api': {
                target,
                secure: false
            }
        },
        port: isDocker ? 5713 : 5173,
        host: isDocker ? '0.0.0.0' : 'localhost',
        https: httpsConfig,
        // Add this line to handle client-side routing
        historyApiFallback: true
    }
})