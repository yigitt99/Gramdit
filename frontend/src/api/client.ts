import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
}

class ApiClient {
  private client: AxiosInstance;

  constructor(config: ApiClientConfig) {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: config.headers,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('gramdit_token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        if (import.meta.env.DEV) {
          console.log(`→ ${config.method?.toUpperCase()} ${config.url}`);
        }
        return config;
      },
      (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        if (import.meta.env.DEV) {
          console.log(`← ${response.status} ${response.config.url}`);
        }
        return response.data;
      },
      async (error) => {
        const originalRequest = error.config;

        // Auto-refresh token on 401 Unauthorized
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
          originalRequest._retry = true;
          const refreshToken = localStorage.getItem('gramdit_refresh_token');

          if (refreshToken) {
            try {
              const baseURL = this.client.defaults.baseURL;
              const refreshResponse = await axios.post(`${baseURL}/auth/refresh`, {
                refreshToken,
              });


              const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data;

              // Save new tokens
              localStorage.setItem('gramdit_token', accessToken);
              localStorage.setItem('gramdit_refresh_token', newRefreshToken);

              // Retry original request
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              }
              return this.client(originalRequest);
            } catch (refreshError) {
              // Revoke session if refresh fails
              localStorage.removeItem('gramdit_token');
              localStorage.removeItem('gramdit_refresh_token');
              localStorage.removeItem('gramdit_user');
              window.location.href = '/login';
              return Promise.reject(refreshError);
            }
          } else {
            // No refresh token available - direct to login
            localStorage.removeItem('gramdit_token');
            localStorage.removeItem('gramdit_refresh_token');
            localStorage.removeItem('gramdit_user');
            window.location.href = '/login';
          }
        }

        const responseData = error.response?.data;
        let errorMessage = 'An error occurred';

        if (responseData) {
          if (Array.isArray(responseData.message)) {
            errorMessage = responseData.message[0]; // Take first validation error
          } else if (typeof responseData.message === 'string') {
            errorMessage = responseData.message;
          } else if (responseData.error?.message) {
            errorMessage = responseData.error.message;
          }
        }

        const errorData = {
          status: error.response?.status || 0,
          message: errorMessage,
          code: responseData?.error?.code || 'UNKNOWN_ERROR',
        };
        console.error('Response error:', errorData);
        return Promise.reject(errorData);
      }
    );

  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.get(url, config);
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.client.post(url, data, config);
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.client.put(url, data, config);
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.delete(url, config);
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.client.patch(url, data, config);
  }
}

// Initialize API client with environment variables
const apiClient = new ApiClient({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000'),
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
