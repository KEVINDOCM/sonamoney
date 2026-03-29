export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          balance: number
          color: string | null
          created_at: string
          currency: string
          icon: string | null
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          color?: string | null
          created_at?: string
          currency?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          color?: string | null
          created_at?: string
          currency?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string | null
          created_at: string
          event_status: string
          event_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          resource: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string
          event_status: string
          event_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          resource?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string
          event_status?: string
          event_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          resource?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      auth_attempts: {
        Row: {
          attempted_at: string
          email: string
          failure_reason: string | null
          id: string
          ip_address: unknown
          success: boolean
          user_agent: string | null
        }
        Insert: {
          attempted_at?: string
          email: string
          failure_reason?: string | null
          id?: string
          ip_address: unknown
          success?: boolean
          user_agent?: string | null
        }
        Update: {
          attempted_at?: string
          email?: string
          failure_reason?: string | null
          id?: string
          ip_address?: unknown
          success?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      budget_periods: {
        Row: {
          budget_amount: number
          category_id: string | null
          created_at: string
          currency: string
          id: string
          is_active: boolean
          period_end: string
          period_start: string
          period_type: string
          spent_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_amount: number
          category_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          period_end: string
          period_start: string
          period_type: string
          spent_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_amount?: number
          category_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          period_end?: string
          period_start?: string
          period_type?: string
          spent_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_periods_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          budget_limit: number | null
          color: string
          created_at: string
          icon: string | null
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          sort_order: number | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_limit?: number | null
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          sort_order?: number | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_limit?: number | null
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          sort_order?: number | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      debt_payments: {
        Row: {
          amount: number
          created_at: string
          debt_id: string
          id: string
          interest_paid: number | null
          notes: string | null
          payment_date: string
          principal_paid: number | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          debt_id: string
          id?: string
          interest_paid?: number | null
          notes?: string | null
          payment_date?: string
          principal_paid?: number | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          debt_id?: string
          id?: string
          interest_paid?: number | null
          notes?: string | null
          payment_date?: string
          principal_paid?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "debt_payments_debt_id_fkey"
            columns: ["debt_id"]
            isOneToOne: false
            referencedRelation: "debts"
            referencedColumns: ["id"]
          },
        ]
      }
      debts: {
        Row: {
          color: string | null
          created_at: string
          currency: string
          current_balance: number
          end_date: string | null
          icon: string | null
          id: string
          interest_rate: number
          interest_type: string
          is_active: boolean
          lender: string | null
          minimum_payment: number | null
          name: string
          notes: string | null
          original_amount: number
          payment_due_date: number | null
          start_date: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          currency?: string
          current_balance?: number
          end_date?: string | null
          icon?: string | null
          id?: string
          interest_rate?: number
          interest_type?: string
          is_active?: boolean
          lender?: string | null
          minimum_payment?: number | null
          name: string
          notes?: string | null
          original_amount?: number
          payment_due_date?: number | null
          start_date?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          currency?: string
          current_balance?: number
          end_date?: string | null
          icon?: string | null
          id?: string
          interest_rate?: number
          interest_type?: string
          is_active?: boolean
          lender?: string | null
          minimum_payment?: number | null
          name?: string
          notes?: string | null
          original_amount?: number
          payment_due_date?: number | null
          start_date?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      default_categories: {
        Row: {
          budget_limit: number | null
          color: string
          created_at: string
          icon: string
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          type: string
        }
        Insert: {
          budget_limit?: number | null
          color: string
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          type: string
        }
        Update: {
          budget_limit?: number | null
          color?: string
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          type?: string
        }
        Relationships: []
      }
      financial_health_scores: {
        Row: {
          calculated_at: string
          category: string
          debt_to_income_score: number | null
          emergency_fund_score: number | null
          expense_ratio_score: number | null
          id: string
          months_of_expenses: number | null
          savings_rate_score: number | null
          score: number
          total_debt: number | null
          total_expenses: number | null
          total_income: number | null
          total_savings: number | null
          user_id: string
        }
        Insert: {
          calculated_at?: string
          category: string
          debt_to_income_score?: number | null
          emergency_fund_score?: number | null
          expense_ratio_score?: number | null
          id?: string
          months_of_expenses?: number | null
          savings_rate_score?: number | null
          score: number
          total_debt?: number | null
          total_expenses?: number | null
          total_income?: number | null
          total_savings?: number | null
          user_id: string
        }
        Update: {
          calculated_at?: string
          category?: string
          debt_to_income_score?: number | null
          emergency_fund_score?: number | null
          expense_ratio_score?: number | null
          id?: string
          months_of_expenses?: number | null
          savings_rate_score?: number | null
          score?: number
          total_debt?: number | null
          total_expenses?: number | null
          total_income?: number | null
          total_savings?: number | null
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          color: string | null
          completed_at: string | null
          created_at: string
          currency: string
          current_amount: number
          deadline: string | null
          icon: string | null
          id: string
          is_completed: boolean
          name: string
          priority: number | null
          target_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          completed_at?: string | null
          created_at?: string
          currency?: string
          current_amount?: number
          deadline?: string | null
          icon?: string | null
          id?: string
          is_completed?: boolean
          name: string
          priority?: number | null
          target_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          completed_at?: string | null
          created_at?: string
          currency?: string
          current_amount?: number
          deadline?: string | null
          icon?: string | null
          id?: string
          is_completed?: boolean
          name?: string
          priority?: number | null
          target_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ip_blocks: {
        Row: {
          blocked_at: string | null
          created_at: string
          expires_at: string
          failed_attempts: number
          first_attempt_at: string
          id: string
          ip_address: unknown
          reason: string
          triggered_by: string | null
        }
        Insert: {
          blocked_at?: string | null
          created_at?: string
          expires_at: string
          failed_attempts?: number
          first_attempt_at?: string
          id?: string
          ip_address: unknown
          reason: string
          triggered_by?: string | null
        }
        Update: {
          blocked_at?: string | null
          created_at?: string
          expires_at?: string
          failed_attempts?: number
          first_attempt_at?: string
          id?: string
          ip_address?: unknown
          reason?: string
          triggered_by?: string | null
        }
        Relationships: []
      }
      mfa_audit_log: {
        Row: {
          created_at: string
          credential_id: string | null
          event_type: string
          failure_reason: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          method: string | null
          success: boolean
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          credential_id?: string | null
          event_type: string
          failure_reason?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          method?: string | null
          success: boolean
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          credential_id?: string | null
          event_type?: string
          failure_reason?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          method?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mfa_audit_log_credential_id_fkey"
            columns: ["credential_id"]
            isOneToOne: false
            referencedRelation: "webauthn_credentials"
            referencedColumns: ["id"]
          },
        ]
      }
      mfa_settings: {
        Row: {
          created_at: string
          device_count: number
          enforcement_level: string
          id: string
          last_mfa_verified_at: string | null
          preferred_method: string | null
          recovery_codes_hash: string[] | null
          recovery_codes_used: boolean[] | null
          totp_enabled: boolean
          updated_at: string
          user_id: string
          webauthn_enabled: boolean
        }
        Insert: {
          created_at?: string
          device_count?: number
          enforcement_level?: string
          id?: string
          last_mfa_verified_at?: string | null
          preferred_method?: string | null
          recovery_codes_hash?: string[] | null
          recovery_codes_used?: boolean[] | null
          totp_enabled?: boolean
          updated_at?: string
          user_id: string
          webauthn_enabled?: boolean
        }
        Update: {
          created_at?: string
          device_count?: number
          enforcement_level?: string
          id?: string
          last_mfa_verified_at?: string | null
          preferred_method?: string | null
          recovery_codes_hash?: string[] | null
          recovery_codes_used?: boolean[] | null
          totp_enabled?: boolean
          updated_at?: string
          user_id?: string
          webauthn_enabled?: boolean
        }
        Relationships: []
      }
      mfa_verification_sessions: {
        Row: {
          challenge: string
          created_at: string
          expires_at: string
          id: string
          ip_address: unknown
          method: string
          session_token_hash: string
          user_agent: string | null
          user_id: string
          verified: boolean
          verified_at: string | null
        }
        Insert: {
          challenge: string
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown
          method: string
          session_token_hash: string
          user_agent?: string | null
          user_id: string
          verified?: boolean
          verified_at?: string | null
        }
        Update: {
          challenge?: string
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown
          method?: string
          session_token_hash?: string
          user_agent?: string | null
          user_id?: string
          verified?: boolean
          verified_at?: string | null
        }
        Relationships: []
      }
      rate_limit_entries: {
        Row: {
          created_at: string
          endpoint_type: string
          id: string
          identifier: string | null
          ip_address: unknown
          max_requests: number
          request_count: number
          updated_at: string
          window_duration_ms: number
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint_type: string
          id?: string
          identifier?: string | null
          ip_address: unknown
          max_requests: number
          request_count?: number
          updated_at?: string
          window_duration_ms: number
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint_type?: string
          id?: string
          identifier?: string | null
          ip_address?: unknown
          max_requests?: number
          request_count?: number
          updated_at?: string
          window_duration_ms?: number
          window_start?: string
        }
        Relationships: []
      }
      rate_limit_violations: {
        Row: {
          endpoint: string
          id: string
          ip_address: unknown
          metadata: Json | null
          timestamp: string
          user_agent: string | null
          user_id: string | null
          violation_type: string
        }
        Insert: {
          endpoint: string
          id?: string
          ip_address: unknown
          metadata?: Json | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
          violation_type: string
        }
        Update: {
          endpoint?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
          violation_type?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          action: string
          conditions: Json | null
          created_at: string
          description: string | null
          id: string
          resource: string
          role: string
        }
        Insert: {
          action: string
          conditions?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          resource: string
          role: string
        }
        Update: {
          action?: string
          conditions?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          resource?: string
          role?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string
          currency: string
          date_format: string
          email_notifications: boolean | null
          enable_budget_alerts: boolean | null
          enable_receipt_scanning: boolean | null
          enable_recurring_notifications: boolean | null
          id: string
          language: string
          number_format: string
          push_notifications: boolean | null
          require_password_for_sensitive: boolean | null
          session_timeout_minutes: number | null
          theme: string
          timezone: string
          updated_at: string
          user_id: string
          weekly_summary_day: number | null
        }
        Insert: {
          created_at?: string
          currency?: string
          date_format?: string
          email_notifications?: boolean | null
          enable_budget_alerts?: boolean | null
          enable_receipt_scanning?: boolean | null
          enable_recurring_notifications?: boolean | null
          id?: string
          language?: string
          number_format?: string
          push_notifications?: boolean | null
          require_password_for_sensitive?: boolean | null
          session_timeout_minutes?: number | null
          theme?: string
          timezone?: string
          updated_at?: string
          user_id: string
          weekly_summary_day?: number | null
        }
        Update: {
          created_at?: string
          currency?: string
          date_format?: string
          email_notifications?: boolean | null
          enable_budget_alerts?: boolean | null
          enable_receipt_scanning?: boolean | null
          enable_recurring_notifications?: boolean | null
          id?: string
          language?: string
          number_format?: string
          push_notifications?: boolean | null
          require_password_for_sensitive?: boolean | null
          session_timeout_minutes?: number | null
          theme?: string
          timezone?: string
          updated_at?: string
          user_id?: string
          weekly_summary_day?: number | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string | null
          amount: number
          category_id: string
          commission_rate: number | null
          created_at: string
          currency: string
          date: string
          exchange_rate_at_time: number | null
          id: string
          idempotency_key: string | null
          is_recurring: boolean
          notes: string | null
          recurring_interval: number | null
          recurring_next_date: string | null
          recurring_parent_id: string | null
          recurring_unit: string | null
          tax_rate: number | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          category_id: string
          commission_rate?: number | null
          created_at?: string
          currency?: string
          date: string
          exchange_rate_at_time?: number | null
          id?: string
          idempotency_key?: string | null
          is_recurring?: boolean
          notes?: string | null
          recurring_interval?: number | null
          recurring_next_date?: string | null
          recurring_parent_id?: string | null
          recurring_unit?: string | null
          tax_rate?: number | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          category_id?: string
          commission_rate?: number | null
          created_at?: string
          currency?: string
          date?: string
          exchange_rate_at_time?: number | null
          id?: string
          idempotency_key?: string | null
          is_recurring?: boolean
          notes?: string | null
          recurring_interval?: number | null
          recurring_next_date?: string | null
          recurring_parent_id?: string | null
          recurring_unit?: string | null
          tax_rate?: number | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "mv_account_balance_history"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_recurring_parent_id_fkey"
            columns: ["recurring_parent_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transfers: {
        Row: {
          amount: number
          converted_amount: number | null
          created_at: string
          date: string
          exchange_rate: number
          fee_amount: number | null
          from_account_id: string
          from_currency: string
          id: string
          notes: string | null
          to_account_id: string
          to_currency: string
          user_id: string
        }
        Insert: {
          amount: number
          converted_amount?: number | null
          created_at?: string
          date: string
          exchange_rate?: number
          fee_amount?: number | null
          from_account_id: string
          from_currency?: string
          id?: string
          notes?: string | null
          to_account_id: string
          to_currency?: string
          user_id: string
        }
        Update: {
          amount?: number
          converted_amount?: number | null
          created_at?: string
          date?: string
          exchange_rate?: number
          fee_amount?: number | null
          from_account_id?: string
          from_currency?: string
          id?: string
          notes?: string | null
          to_account_id?: string
          to_currency?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfers_from_account_id_fkey"
            columns: ["from_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_from_account_id_fkey"
            columns: ["from_account_id"]
            isOneToOne: false
            referencedRelation: "mv_account_balance_history"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "transfers_to_account_id_fkey"
            columns: ["to_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_to_account_id_fkey"
            columns: ["to_account_id"]
            isOneToOne: false
            referencedRelation: "mv_account_balance_history"
            referencedColumns: ["account_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: string
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      webauthn_credentials: {
        Row: {
          aaguid: string | null
          attestation_format: string | null
          attestation_object: string | null
          created_at: string
          credential_id: string
          device_name: string
          device_type: string | null
          id: string
          is_active: boolean
          is_backup: boolean
          last_used_at: string | null
          last_verified_at: string
          public_key: string
          registered_at: string
          sign_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          aaguid?: string | null
          attestation_format?: string | null
          attestation_object?: string | null
          created_at?: string
          credential_id: string
          device_name?: string
          device_type?: string | null
          id?: string
          is_active?: boolean
          is_backup?: boolean
          last_used_at?: string | null
          last_verified_at?: string
          public_key: string
          registered_at?: string
          sign_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          aaguid?: string | null
          attestation_format?: string | null
          attestation_object?: string | null
          created_at?: string
          credential_id?: string
          device_name?: string
          device_type?: string | null
          id?: string
          is_active?: boolean
          is_backup?: boolean
          last_used_at?: string | null
          last_verified_at?: string
          public_key?: string
          registered_at?: string
          sign_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      mv_account_balance_history: {
        Row: {
          account_id: string | null
          account_name: string | null
          currency: string | null
          current_balance: number | null
          mtd_expense: number | null
          mtd_flow: number | null
          mtd_income: number | null
          snapshot_date: string | null
          user_id: string | null
        }
        Relationships: []
      }
      mv_category_spending: {
        Row: {
          avg_amount: number | null
          category_id: string | null
          month: string | null
          total_amount: number | null
          transaction_count: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_financial_health_overview: {
        Row: {
          account_count: number | null
          computed_at: string | null
          debt_count: number | null
          expense_count_30d: number | null
          expenses_30d: number | null
          foreign_balance: number | null
          idr_balance: number | null
          income_30d: number | null
          income_count_30d: number | null
          net_worth: number | null
          savings_rate_pct: number | null
          total_balance: number | null
          total_debt: number | null
          user_id: string | null
        }
        Relationships: []
      }
      mv_monthly_aggregates: {
        Row: {
          avg_amount: number | null
          category_count: number | null
          max_amount: number | null
          min_amount: number | null
          month: string | null
          total_amount: number | null
          transaction_count: number | null
          type: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      analyze_all_tables: { Args: never; Returns: undefined }
      analyze_transactions_stats: { Args: never; Returns: undefined }
      assign_role: {
        Args: {
          p_assigned_by: string
          p_role: string
          p_target_user_id: string
        }
        Returns: boolean
      }
      atomic_balance_adjust: {
        Args: { p_account_id: string; p_delta: number; p_user_id: string }
        Returns: Json
      }
      atomic_create_transaction: {
        Args: {
          p_account_id?: string
          p_amount: number
          p_category_id: string
          p_currency?: string
          p_date: string
          p_exchange_rate_at_time?: number
          p_idempotency_key?: string
          p_is_recurring?: boolean
          p_notes?: string
          p_recurring_interval?: number
          p_recurring_next_date?: string
          p_recurring_unit?: string
          p_type: string
          p_user_id: string
        }
        Returns: Json
      }
      atomic_delete_transaction: {
        Args: { p_transaction_id: string; p_user_id: string }
        Returns: Json
      }
      atomic_log_recurring_transaction: {
        Args: {
          p_idempotency_key?: string
          p_parent_id: string
          p_user_id: string
        }
        Returns: Json
      }
      atomic_skip_recurring: {
        Args: { p_parent_id: string; p_user_id: string }
        Returns: Json
      }
      atomic_stop_recurring: {
        Args: { p_parent_id: string; p_user_id: string }
        Returns: Json
      }
      atomic_update_transaction: {
        Args: {
          p_account_id?: string
          p_amount: number
          p_category_id: string
          p_currency?: string
          p_date: string
          p_exchange_rate_at_time?: number
          p_is_recurring?: boolean
          p_notes?: string
          p_recurring_interval?: number
          p_recurring_next_date?: string
          p_recurring_unit?: string
          p_transaction_id: string
          p_type: string
          p_user_id: string
        }
        Returns: Json
      }
      calculate_debt_payoff: {
        Args: { p_debt_id: string; p_monthly_payment: number }
        Returns: {
          months_to_payoff: number
          payoff_date: string
          total_interest: number
        }[]
      }
      calculate_net_worth: { Args: { p_user_id: string }; Returns: Json }
      calculate_next_recurring_date: {
        Args: { p_base_date: string; p_interval: number; p_unit: string }
        Returns: string
      }
      cleanup_expired_ip_blocks: { Args: never; Returns: number }
      cleanup_expired_mfa_sessions: { Args: never; Returns: number }
      cleanup_expired_rate_limits: { Args: never; Returns: number }
      cleanup_old_audit_logs: { Args: never; Returns: number }
      cleanup_old_auth_attempts: { Args: never; Returns: number }
      cleanup_old_idempotency_keys: { Args: never; Returns: number }
      cleanup_old_mfa_audit: { Args: never; Returns: number }
      cleanup_old_violations: { Args: never; Returns: number }
      get_active_webauthn_credentials: {
        Args: { p_user_id: string }
        Returns: {
          credential_id: string
          device_name: string
          public_key: string
          sign_count: number
        }[]
      }
      get_budget_status: {
        Args: {
          p_category_id?: string
          p_period_type?: string
          p_user_id: string
        }
        Returns: {
          budget_amount: number
          category_id: string
          percentage_used: number
          remaining_amount: number
          spent_amount: number
          status: string
        }[]
      }
      get_index_stats: {
        Args: never
        Returns: {
          idx_scan: number
          idx_tup_fetch: number
          idx_tup_read: number
          index_name: string
          index_size: string
          table_name: string
        }[]
      }
      get_period_summary: {
        Args: { p_end_date: string; p_start_date: string; p_user_id: string }
        Returns: Json
      }
      get_user_account_balances: {
        Args: never
        Returns: {
          account_id: string
          account_name: string
          currency: string
          current_balance: number
          mtd_expense: number
          mtd_flow: number
          mtd_income: number
          snapshot_date: string
        }[]
      }
      get_user_category_spending: {
        Args: { p_category_id?: string; p_month?: string }
        Returns: {
          avg_amount: number
          category_id: string
          month: string
          total_amount: number
          transaction_count: number
        }[]
      }
      get_user_dashboard_summary: { Args: never; Returns: Json }
      get_user_financial_health: {
        Args: never
        Returns: {
          account_count: number
          computed_at: string
          debt_count: number
          expense_count_30d: number
          expenses_30d: number
          foreign_balance: number
          idr_balance: number
          income_30d: number
          income_count_30d: number
          net_worth: number
          savings_rate_pct: number
          total_balance: number
          total_debt: number
        }[]
      }
      get_user_monthly_aggregates:
        | {
            Args: { p_month?: string }
            Returns: {
              avg_amount: number
              category_count: number
              max_amount: number
              min_amount: number
              month: string
              total_amount: number
              transaction_count: number
              type: string
            }[]
          }
        | {
            Args: { p_end_date?: string; p_start_date?: string }
            Returns: {
              avg_amount: number
              month: string
              total_amount: number
              transaction_count: number
              type: string
            }[]
          }
      get_user_role: { Args: { p_user_id: string }; Returns: string }
      has_permission: {
        Args: { p_action: string; p_resource: string; p_user_id: string }
        Returns: boolean
      }
      increment_ai_rate_limit: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      initialize_new_user: {
        Args: { p_currency?: string; p_language?: string; p_user_id: string }
        Returns: Json
      }
      is_admin: { Args: { p_user_id: string }; Returns: boolean }
      is_ip_blocked: { Args: { p_ip_address: unknown }; Returns: boolean }
      log_mfa_event: {
        Args: {
          p_credential_id?: string
          p_event_type: string
          p_failure_reason?: string
          p_ip_address?: unknown
          p_metadata?: Json
          p_method?: string
          p_success?: boolean
          p_user_agent?: string
          p_user_id: string
        }
        Returns: undefined
      }
      log_security_event: {
        Args: {
          p_action?: string
          p_event_status: string
          p_event_type: string
          p_ip_address?: unknown
          p_metadata?: Json
          p_new_data?: Json
          p_old_data?: Json
          p_record_id?: string
          p_resource?: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      onboard_new_user: {
        Args: { p_currency?: string; p_language?: string; p_user_id: string }
        Returns: Json
      }
      process_transfer: {
        Args: {
          p_amount: number
          p_exchange_rate?: number
          p_from_account_id: string
          p_notes?: string
          p_to_account_id: string
          p_user_id: string
        }
        Returns: Json
      }
      process_transfer_balances: {
        Args: {
          p_amount: number
          p_exchange_rate?: number
          p_from_account_id: string
          p_to_account_id: string
        }
        Returns: undefined
      }
      refresh_all_materialized_views: { Args: never; Returns: Json }
      refresh_materialized_view: {
        Args: { p_view_name: string }
        Returns: Json
      }
      refresh_monthly_aggregates: { Args: never; Returns: undefined }
      run_security_cleanup: { Args: never; Returns: Json }
      seed_default_account: {
        Args: { p_currency?: string; p_user_id: string }
        Returns: string
      }
      seed_user_categories: { Args: { p_user_id: string }; Returns: number }
      update_webauthn_sign_count: {
        Args: { p_credential_id: string; p_new_sign_count: number }
        Returns: boolean
      }
      user_has_mfa_enabled: { Args: { p_user_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
