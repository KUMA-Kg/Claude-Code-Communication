// API Configuration
export const API_CONFIG = {
  // Supabase Configuration
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key',
    options: {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      },
      global: {
        headers: {
          'x-app-version': '1.0.0'
        }
      }
    }
  },

  // Backend API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
    version: 'v1',
    timeout: 30000, // 30 seconds
    endpoints: {
      // Authentication
      auth: {
        login: '/auth/login',
        signup: '/auth/signup',
        logout: '/auth/logout',
        refresh: '/auth/refresh',
        verify: '/auth/verify',
        resetPassword: '/auth/reset-password',
        updateProfile: '/auth/profile'
      },
      
      // Subsidies
      subsidies: {
        list: '/subsidies',
        detail: '/subsidies/:id',
        search: '/subsidies/search',
        filter: '/subsidies/filter',
        matching: '/subsidies/matching',
        aiMatch: '/subsidies/ai-match'
      },
      
      // Applications
      applications: {
        create: '/applications',
        list: '/applications',
        detail: '/applications/:id',
        update: '/applications/:id',
        delete: '/applications/:id',
        submit: '/applications/:id/submit',
        status: '/applications/:id/status'
      },
      
      // Documents
      documents: {
        upload: '/documents/upload',
        list: '/documents',
        download: '/documents/:id',
        delete: '/documents/:id',
        generate: '/documents/generate'
      },
      
      // Export
      export: {
        csv: '/export/csv',
        excel: '/export/excel',
        pdf: '/export/pdf',
        batch: '/export/batch'
      },
      
      // Analytics
      analytics: {
        dashboard: '/analytics/dashboard',
        reports: '/analytics/reports',
        metrics: '/analytics/metrics'
      }
    }
  },

  // Feature Flags
  features: {
    enableRealtime: import.meta.env.VITE_ENABLE_REALTIME !== 'false', // デフォルトでtrue
    enableAIMatching: import.meta.env.VITE_ENABLE_AI_MATCHING !== 'false', // デフォルトでtrue
    enableExport: import.meta.env.VITE_ENABLE_EXPORT !== 'false' // デフォルトでtrue
  },

  // Security Configuration
  security: {
    sessionTimeout: parseInt(import.meta.env.VITE_SESSION_TIMEOUT || '3600000'),
    maxLoginAttempts: parseInt(import.meta.env.VITE_MAX_LOGIN_ATTEMPTS || '5'),
    tokenRefreshBuffer: 300000 // 5 minutes before expiry
  }
};

// Helper function to build API URLs
export const buildApiUrl = (endpoint: string, params?: Record<string, string>): string => {
  const baseUrl = `${API_CONFIG.api.baseUrl}/api/${API_CONFIG.api.version}`;
  let url = `${baseUrl}${endpoint}`;
  
  // Replace path parameters
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, value);
    });
  }
  
  return url;
};

// API Headers configuration
export const getApiHeaders = (includeAuth: boolean = true): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-App-Version': '1.0.0',
    'X-Client-Type': 'web'
  };

  if (includeAuth) {
    const token = localStorage.getItem('auth-token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

// Error handling configuration
export const API_ERROR_CODES = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 422,
  SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;

export const API_ERROR_MESSAGES: Record<number, string> = {
  [API_ERROR_CODES.UNAUTHORIZED]: '認証が必要です。ログインしてください。',
  [API_ERROR_CODES.FORBIDDEN]: 'このリソースへのアクセス権限がありません。',
  [API_ERROR_CODES.NOT_FOUND]: 'リクエストされたリソースが見つかりません。',
  [API_ERROR_CODES.VALIDATION_ERROR]: '入力内容に誤りがあります。',
  [API_ERROR_CODES.SERVER_ERROR]: 'サーバーエラーが発生しました。',
  [API_ERROR_CODES.SERVICE_UNAVAILABLE]: 'サービスが一時的に利用できません。'
};