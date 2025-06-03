# DoveText API Configuration

This document explains how to configure the API server settings for different environments in the DoveText application.

## Overview

The application supports different API server configurations for various environments:

- **Production**: Uses `api.dovetext.com` by default
- **Development**: Uses `localhost:8081` by default
- **Local Custom Domain**: Can be configured to use `api.dovetext.cn`

## Configuration Methods

### 1. Environment Variables

The API configuration is controlled through environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | Base URL for API requests | Environment-specific |
| `NEXT_PUBLIC_USE_CUSTOM_DOMAIN` | Whether to use custom domain in development | `false` |

### 2. Local Development with Custom Domain

To use `api.dovetext.cn` for local development:

1. Create a `.env.local` file in the project root with:

```
NEXT_PUBLIC_USE_CUSTOM_DOMAIN=true
```

2. Ensure your hosts file maps `api.dovetext.cn` to your local IP:

```
127.0.0.1  api.dovetext.cn
127.0.0.1  www.dovetext.cn
```

3. Start your backend server and ensure it's configured to accept requests from this domain.

### 3. Production Configuration

For production deployment on GitHub Pages:

1. Set the appropriate environment variables in your GitHub repository settings:

```
NEXT_PUBLIC_API_BASE_URL=https://api.dovetext.com
NEXT_PUBLIC_BASE_PATH=/dove.text  # If deploying to a subpath
```

## How It Works

The API configuration is centralized in `/src/config/api.ts`, which:

1. Determines the current environment
2. Selects the appropriate base URL based on environment and configuration
3. Provides helper functions for building complete API URLs

## API Utility Functions

The application provides utility functions in `/src/utils/api.ts` for making API requests:

```typescript
// GET request
const { data, error } = await api.get('public/auth/check-email', { token });

// POST request
const { data, error } = await api.post('public/auth/signin', { 
  email, 
  password 
});
```

These functions automatically use the configured API base URL and handle common tasks like:

- Adding authorization headers
- Serializing request bodies
- Handling timeouts
- Parsing responses

## Troubleshooting

If you encounter issues with API connectivity:

1. Check your environment variables are correctly set
2. Verify your hosts file configuration if using custom domains
3. Ensure CORS is properly configured on your backend server
4. Check browser console for network errors
