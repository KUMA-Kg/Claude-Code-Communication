// API utilities
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function fetchApi(endpoint: string, options?: RequestInit) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new ApiError(
        `API request failed: ${response.statusText}`,
        response.status
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error', 0, 'NETWORK_ERROR');
  }
}

// Auth APIs
export const authApi = {
  login: async (email: string, password: string) => {
    return { success: true, user: { email } };
  },
  
  signup: async (email: string, password: string) => {
    return { success: true, user: { email } };
  },
  
  logout: async () => {
    return { success: true };
  },
  
  checkAuth: async () => {
    const email = localStorage.getItem('userEmail');
    if (email) {
      return { authenticated: true, user: { email } };
    }
    return { authenticated: false };
  },
};

// Subsidy APIs
export const subsidyApi = {
  search: async (query: any) => {
    // Mock implementation
    return {
      subsidies: [
        {
          id: 'it-donyu-2024',
          name: 'IT導入補助金2024',
          description: 'ITツール導入による業務効率化・DX推進を支援',
          maxAmount: '450万円',
          subsidyRate: '最大3/4',
          category: 'IT',
          subsidyAmount: { min: 0, max: 4500000 },
          applicationPeriod: { start: '2024-01-01', end: '2024-12-31' },
          eligibleCompanies: ['中小企業'],
          requirements: ['IT導入計画'],
        },
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    };
  },
  
  getFavorites: async () => {
    // Mock implementation - get from localStorage
    const favorites = localStorage.getItem('favorites');
    return favorites ? JSON.parse(favorites) : [];
  },
  
  addToFavorites: async (subsidyId: string) => {
    const favorites = localStorage.getItem('favorites');
    const currentFavorites = favorites ? JSON.parse(favorites) : [];
    currentFavorites.push({ id: subsidyId, addedAt: new Date().toISOString() });
    localStorage.setItem('favorites', JSON.stringify(currentFavorites));
    return { success: true };
  },
  
  removeFromFavorites: async (subsidyId: string) => {
    const favorites = localStorage.getItem('favorites');
    const currentFavorites = favorites ? JSON.parse(favorites) : [];
    const filtered = currentFavorites.filter((f: any) => f.id !== subsidyId);
    localStorage.setItem('favorites', JSON.stringify(filtered));
    return { success: true };
  },
};