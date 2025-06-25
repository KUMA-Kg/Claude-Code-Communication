export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          company_name: string | null;
          created_at: string;
          updated_at: string;
          last_login: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          email: string;
          full_name?: string | null;
          company_name?: string | null;
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          company_name?: string | null;
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
          is_active?: boolean;
        };
      };
      subsidies: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          category: string;
          organizer: string;
          subsidy_amount_min: number;
          subsidy_amount_max: number;
          subsidy_rate: number;
          application_start: string;
          application_end: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          category: string;
          organizer: string;
          subsidy_amount_min: number;
          subsidy_amount_max: number;
          subsidy_rate: number;
          application_start: string;
          application_end: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          category?: string;
          organizer?: string;
          subsidy_amount_min?: number;
          subsidy_amount_max?: number;
          subsidy_rate?: number;
          application_start?: string;
          application_end?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      applications: {
        Row: {
          id: string;
          user_id: string;
          subsidy_id: string;
          status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
          form_data: Record<string, any>;
          documents: string[] | null;
          submission_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subsidy_id: string;
          status?: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
          form_data: Record<string, any>;
          documents?: string[] | null;
          submission_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subsidy_id?: string;
          status?: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
          form_data?: Record<string, any>;
          documents?: string[] | null;
          submission_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_favorites: {
        Row: {
          user_id: string;
          subsidy_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          subsidy_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          subsidy_id?: string;
          created_at?: string;
        };
      };
      matching_results: {
        Row: {
          id: string;
          user_id: string;
          questionnaire_data: Record<string, any>;
          matched_subsidies: Array<{
            subsidy_id: string;
            match_score: number;
            reasons: string[];
          }>;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          questionnaire_data: Record<string, any>;
          matched_subsidies: Array<{
            subsidy_id: string;
            match_score: number;
            reasons: string[];
          }>;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          questionnaire_data?: Record<string, any>;
          matched_subsidies?: Array<{
            subsidy_id: string;
            match_score: number;
            reasons: string[];
          }>;
          created_at?: string;
        };
      };
    };
    Views: {
      // ビューの定義（もしあれば）
    };
    Functions: {
      // 関数の定義（もしあれば）
    };
    Enums: {
      application_status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
    };
  };
}

// タイプのエクスポート
export type User = Database['public']['Tables']['users']['Row'];
export type Subsidy = Database['public']['Tables']['subsidies']['Row'];
export type Application = Database['public']['Tables']['applications']['Row'];
export type MatchingResult = Database['public']['Tables']['matching_results']['Row'];
export type UserFavorite = Database['public']['Tables']['user_favorites']['Row'];

export type ApplicationStatus = Database['public']['Enums']['application_status'];