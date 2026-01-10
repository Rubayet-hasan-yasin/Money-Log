// API Configuration
// The API URL is loaded from environment variable (EXPO_PUBLIC_API_URL)
// Set it in .env file: EXPO_PUBLIC_API_URL=http://your-api-url/api/v1

export const API_CONFIG = {
  // Load from environment variable, fallback to localhost for development
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
  
  // Timeout for API requests (in milliseconds)
  TIMEOUT: 30000,
};
