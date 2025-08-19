// Supabase database type definitions
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          website: string | null;
          is_admin: boolean;
          email_verified: boolean;
          created_at: string;
          updated_at: string;
          last_login: string | null;
          login_count: number;
          consent_analytics: boolean;
          consent_marketing: boolean;
          data_retention_agreed: boolean;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          website?: string | null;
          is_admin?: boolean;
          email_verified?: boolean;
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
          login_count?: number;
          consent_analytics?: boolean;
          consent_marketing?: boolean;
          data_retention_agreed?: boolean;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          website?: string | null;
          is_admin?: boolean;
          email_verified?: boolean;
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
          login_count?: number;
          consent_analytics?: boolean;
          consent_marketing?: boolean;
          data_retention_agreed?: boolean;
        };
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string | null;
          author_name: string;
          author_email: string;
          author_website: string | null;
          content: string;
          status: 'pending' | 'approved' | 'rejected' | 'spam';
          parent_id: string | null;
          likes: number;
          is_edited: boolean;
          edited_at: string | null;
          created_at: string;
          updated_at: string;
          ip_address: string | null;
          user_agent: string | null;
          referrer: string | null;
          spam_score: number;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id?: string | null;
          author_name: string;
          author_email: string;
          author_website?: string | null;
          content: string;
          status?: 'pending' | 'approved' | 'rejected' | 'spam';
          parent_id?: string | null;
          likes?: number;
          is_edited?: boolean;
          edited_at?: string | null;
          created_at?: string;
          updated_at?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          referrer?: string | null;
          spam_score?: number;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string | null;
          author_name?: string;
          author_email?: string;
          author_website?: string | null;
          content?: string;
          status?: 'pending' | 'approved' | 'rejected' | 'spam';
          parent_id?: string | null;
          likes?: number;
          is_edited?: boolean;
          edited_at?: string | null;
          created_at?: string;
          updated_at?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          referrer?: string | null;
          spam_score?: number;
        };
      };
      comment_likes: {
        Row: {
          id: string;
          comment_id: string;
          user_id: string | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          comment_id: string;
          user_id?: string | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          comment_id?: string;
          user_id?: string | null;
          ip_address?: string | null;
          created_at?: string;
        };
      };
      user_sessions: {
        Row: {
          id: string;
          user_id: string;
          session_token: string;
          expires_at: string;
          created_at: string;
          ip_address: string | null;
          user_agent: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_token: string;
          expires_at: string;
          created_at?: string;
          ip_address?: string | null;
          user_agent?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_token?: string;
          expires_at?: string;
          created_at?: string;
          ip_address?: string | null;
          user_agent?: string | null;
        };
      };
      gdpr_consents: {
        Row: {
          id: string;
          user_id: string | null;
          ip_address: string | null;
          consent_analytics: boolean;
          consent_marketing: boolean;
          consent_functional: boolean;
          data_retention_agreed: boolean;
          privacy_policy_version: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          ip_address?: string | null;
          consent_analytics: boolean;
          consent_marketing: boolean;
          consent_functional: boolean;
          data_retention_agreed: boolean;
          privacy_policy_version: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          ip_address?: string | null;
          consent_analytics?: boolean;
          consent_marketing?: boolean;
          consent_functional?: boolean;
          data_retention_agreed?: boolean;
          privacy_policy_version?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      rate_limits: {
        Row: {
          id: string;
          identifier: string;
          action: string;
          count: number;
          window_start: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          identifier: string;
          action: string;
          count?: number;
          window_start: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          identifier?: string;
          action?: string;
          count?: number;
          window_start?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      comment_stats: {
        Row: {
          post_id: string;
          total_comments: number;
          approved_comments: number;
          pending_comments: number;
          total_likes: number;
        };
      };
    };
    Functions: {
      get_comments_with_replies: {
        Args: {
          post_id_param: string;
          limit_param?: number;
          offset_param?: number;
        };
        Returns: {
          id: string;
          post_id: string;
          author_name: string;
          author_email: string;
          author_website: string | null;
          content: string;
          status: string;
          parent_id: string | null;
          likes: number;
          is_edited: boolean;
          created_at: string;
          reply_count: number;
        }[];
      };
      increment_comment_likes: {
        Args: {
          comment_id_param: string;
          user_ip?: string;
        };
        Returns: number;
      };
      decrement_comment_likes: {
        Args: {
          comment_id_param: string;
          user_ip?: string;
        };
        Returns: number;
      };
    };
  };
}
