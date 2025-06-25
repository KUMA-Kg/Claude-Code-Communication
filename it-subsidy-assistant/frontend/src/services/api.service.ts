import { API_CONFIG, buildApiUrl, getApiHeaders, API_ERROR_MESSAGES } from '../config/api.config';

// カスタムエラークラス
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// APIレスポンスの型定義
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}

// リトライ設定
interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryableStatuses: number[];
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  retryableStatuses: [408, 429, 500, 502, 503, 504]
};

// APIサービスクラス
export class ApiService {
  private static instance: ApiService;
  private abortControllers: Map<string, AbortController> = new Map();

  private constructor() {}

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  // リクエストをキャンセル
  cancelRequest(requestId: string): void {
    const controller = this.abortControllers.get(requestId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(requestId);
    }
  }

  // すべてのリクエストをキャンセル
  cancelAllRequests(): void {
    this.abortControllers.forEach(controller => controller.abort());
    this.abortControllers.clear();
  }

  // エラーハンドリング
  private handleError(error: any): never {
    if (error.name === 'AbortError') {
      throw new ApiError(0, 'リクエストがキャンセルされました');
    }

    if (error instanceof ApiError) {
      throw error;
    }

    if (error.response) {
      const status = error.response.status;
      const message = API_ERROR_MESSAGES[status] || error.response.data?.message || 'エラーが発生しました';
      throw new ApiError(status, message, error.response.data);
    }

    if (error.request) {
      throw new ApiError(0, 'ネットワークエラーが発生しました');
    }

    throw new ApiError(0, error.message || '予期しないエラーが発生しました');
  }

  // リトライロジック
  private async retryRequest<T>(
    fn: () => Promise<T>,
    config: RetryConfig = defaultRetryConfig,
    attempt: number = 0
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (
        error instanceof ApiError &&
        attempt < config.maxRetries &&
        config.retryableStatuses.includes(error.status)
      ) {
        await new Promise(resolve => setTimeout(resolve, config.retryDelay * Math.pow(2, attempt)));
        return this.retryRequest(fn, config, attempt + 1);
      }
      throw error;
    }
  }

  // 基本的なfetchラッパー
  private async fetchWithConfig<T>(
    url: string,
    options: RequestInit = {},
    requestId?: string
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    
    if (requestId) {
      this.abortControllers.set(requestId, controller);
    }

    const config: RequestInit = {
      ...options,
      signal: controller.signal,
      headers: {
        ...getApiHeaders(),
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, config);
      
      if (requestId) {
        this.abortControllers.delete(requestId);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(response.status, data.message || 'エラーが発生しました', data);
      }

      return data;
    } catch (error) {
      if (requestId) {
        this.abortControllers.delete(requestId);
      }
      return this.handleError(error);
    }
  }

  // GET リクエスト
  async get<T>(
    endpoint: string,
    params?: Record<string, any>,
    options: RequestInit = {},
    requestId?: string
  ): Promise<ApiResponse<T>> {
    const url = new URL(buildApiUrl(endpoint));
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return this.retryRequest(() => 
      this.fetchWithConfig<T>(url.toString(), {
        ...options,
        method: 'GET'
      }, requestId)
    );
  }

  // POST リクエスト
  async post<T>(
    endpoint: string,
    data?: any,
    options: RequestInit = {},
    requestId?: string
  ): Promise<ApiResponse<T>> {
    return this.fetchWithConfig<T>(buildApiUrl(endpoint), {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    }, requestId);
  }

  // PUT リクエスト
  async put<T>(
    endpoint: string,
    data?: any,
    options: RequestInit = {},
    requestId?: string
  ): Promise<ApiResponse<T>> {
    return this.fetchWithConfig<T>(buildApiUrl(endpoint), {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    }, requestId);
  }

  // PATCH リクエスト
  async patch<T>(
    endpoint: string,
    data?: any,
    options: RequestInit = {},
    requestId?: string
  ): Promise<ApiResponse<T>> {
    return this.fetchWithConfig<T>(buildApiUrl(endpoint), {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    }, requestId);
  }

  // DELETE リクエスト
  async delete<T>(
    endpoint: string,
    options: RequestInit = {},
    requestId?: string
  ): Promise<ApiResponse<T>> {
    return this.fetchWithConfig<T>(buildApiUrl(endpoint), {
      ...options,
      method: 'DELETE'
    }, requestId);
  }

  // ファイルアップロード
  async uploadFile(
    endpoint: string,
    file: File,
    additionalData?: Record<string, any>,
    onProgress?: (progress: number) => void,
    requestId?: string
  ): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const xhr = new XMLHttpRequest();
    
    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        try {
          const response = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(response);
          } else {
            reject(new ApiError(xhr.status, response.message || 'アップロードに失敗しました', response));
          }
        } catch (error) {
          reject(new ApiError(xhr.status, 'レスポンスの解析に失敗しました'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new ApiError(0, 'ネットワークエラーが発生しました'));
      });

      xhr.addEventListener('abort', () => {
        reject(new ApiError(0, 'アップロードがキャンセルされました'));
      });

      xhr.open('POST', buildApiUrl(endpoint));
      
      const token = localStorage.getItem('auth-token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      
      xhr.send(formData);

      if (requestId) {
        // XHRのキャンセル処理を保存
        this.abortControllers.set(requestId, {
          abort: () => xhr.abort()
        } as any);
      }
    });
  }
}

// シングルトンインスタンスをエクスポート
export const apiService = ApiService.getInstance();