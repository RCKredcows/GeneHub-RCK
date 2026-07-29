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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action_type: string
          created_at: string | null
          entity_id: string
          entity_name: string
          entity_type: string
          id: string
          metadata: Json | null
          tenant_id: string
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string | null
          entity_id: string
          entity_name: string
          entity_type: string
          id?: string
          metadata?: Json | null
          tenant_id?: string
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string | null
          entity_id?: string
          entity_name?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["tenant_id", "user_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      allowed_emails: {
        Row: {
          added_by: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_used: boolean | null
          tenant_id: string
          used_at: string | null
        }
        Insert: {
          added_by?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          is_used?: boolean | null
          tenant_id?: string
          used_at?: string | null
        }
        Update: {
          added_by?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_used?: boolean | null
          tenant_id?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "allowed_emails_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      canisters: {
        Row: {
          canister_number: string
          created_at: string | null
          id: string
          notes: string | null
          position_in_tank: number
          tank_id: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          canister_number: string
          created_at?: string | null
          id?: string
          notes?: string | null
          position_in_tank?: number
          tank_id?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Update: {
          canister_number?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          position_in_tank?: number
          tank_id?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "canisters_tank_id_fkey"
            columns: ["tenant_id", "tank_id"]
            isOneToOne: false
            referencedRelation: "tanks"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "canisters_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          state: string | null
          tenant_id: string
          updated_at: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          tenant_id?: string
          updated_at?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          tenant_id?: string
          updated_at?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string | null
          full_name: string
          id: string
          is_active: boolean | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name: string
          id: string
          is_active?: boolean | null
          tenant_id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      genetic_inventory: {
        Row: {
          breed: string
          cane_number: string | null
          canister_id: string | null
          check_in_date: string
          check_out_date: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          embryo_name: string | null
          id: string
          inventory_type: string
          is_ivf: boolean
          notes: string | null
          original_quantity: number
          owner_type: string
          price_for_semen: number | null
          quantity: number
          sex_type: string
          sire_id: string | null
          status: string | null
          tank_id: string | null
          tenant_id: string
          unit: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          breed: string
          cane_number?: string | null
          canister_id?: string | null
          check_in_date?: string
          check_out_date?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          embryo_name?: string | null
          id?: string
          inventory_type: string
          is_ivf?: boolean
          notes?: string | null
          original_quantity: number
          owner_type: string
          price_for_semen?: number | null
          quantity: number
          sex_type?: string
          sire_id?: string | null
          status?: string | null
          tank_id?: string | null
          tenant_id?: string
          unit?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          breed?: string
          cane_number?: string | null
          canister_id?: string | null
          check_in_date?: string
          check_out_date?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          embryo_name?: string | null
          id?: string
          inventory_type?: string
          is_ivf?: boolean
          notes?: string | null
          original_quantity?: number
          owner_type?: string
          price_for_semen?: number | null
          quantity?: number
          sex_type?: string
          sire_id?: string | null
          status?: string | null
          tank_id?: string | null
          tenant_id?: string
          unit?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "genetic_inventory_canister_id_fkey"
            columns: ["tenant_id", "canister_id"]
            isOneToOne: false
            referencedRelation: "canisters"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "genetic_inventory_created_by_fkey"
            columns: ["tenant_id", "created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "genetic_inventory_customer_id_fkey"
            columns: ["tenant_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "genetic_inventory_sire_id_fkey"
            columns: ["tenant_id", "sire_id"]
            isOneToOne: false
            referencedRelation: "sires"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "genetic_inventory_tank_id_fkey"
            columns: ["tenant_id", "tank_id"]
            isOneToOne: false
            referencedRelation: "tanks"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "genetic_inventory_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "genetic_inventory_updated_by_fkey"
            columns: ["tenant_id", "updated_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      nitrogen_fill_history: {
        Row: {
          amount_added: number
          created_at: string | null
          event_type: string | null
          fill_date: string | null
          filled_by: string | null
          id: string
          nitrogen_level_after: number
          nitrogen_level_before: number | null
          notes: string | null
          tank_id: string
          tenant_id: string
        }
        Insert: {
          amount_added: number
          created_at?: string | null
          event_type?: string | null
          fill_date?: string | null
          filled_by?: string | null
          id?: string
          nitrogen_level_after: number
          nitrogen_level_before?: number | null
          notes?: string | null
          tank_id: string
          tenant_id?: string
        }
        Update: {
          amount_added?: number
          created_at?: string | null
          event_type?: string | null
          fill_date?: string | null
          filled_by?: string | null
          id?: string
          nitrogen_level_after?: number
          nitrogen_level_before?: number | null
          notes?: string | null
          tank_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nitrogen_fill_history_filled_by_fkey"
            columns: ["tenant_id", "filled_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "nitrogen_fill_history_tank_id_fkey"
            columns: ["tenant_id", "tank_id"]
            isOneToOne: false
            referencedRelation: "tanks"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "nitrogen_fill_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_log: {
        Row: {
          email_sent_to: string
          error_message: string | null
          id: string
          metadata: Json | null
          notification_type: string
          reference_id: string | null
          reference_name: string | null
          resend_message_id: string | null
          sent_at: string | null
          status: string | null
          tenant_id: string
          user_id: string
        }
        Insert: {
          email_sent_to: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          notification_type: string
          reference_id?: string | null
          reference_name?: string | null
          resend_message_id?: string | null
          sent_at?: string | null
          status?: string | null
          tenant_id?: string
          user_id: string
        }
        Update: {
          email_sent_to?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          notification_type?: string
          reference_id?: string | null
          reference_name?: string | null
          resend_message_id?: string | null
          sent_at?: string | null
          status?: string | null
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      reserved_slugs: {
        Row: {
          slug: string
        }
        Insert: {
          slug: string
        }
        Update: {
          slug?: string
        }
        Relationships: []
      }
      sires: {
        Row: {
          available_for_sale: boolean
          breed: string
          created_at: string | null
          customer_id: string | null
          id: string
          image_url: string | null
          name: string
          notes: string | null
          owner_type: string
          price_for_semen: number | null
          price_for_sexed_semen: number | null
          registration_number: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          available_for_sale?: boolean
          breed: string
          created_at?: string | null
          customer_id?: string | null
          id?: string
          image_url?: string | null
          name: string
          notes?: string | null
          owner_type?: string
          price_for_semen?: number | null
          price_for_sexed_semen?: number | null
          registration_number?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Update: {
          available_for_sale?: boolean
          breed?: string
          created_at?: string | null
          customer_id?: string | null
          id?: string
          image_url?: string | null
          name?: string
          notes?: string | null
          owner_type?: string
          price_for_semen?: number | null
          price_for_sexed_semen?: number | null
          registration_number?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sires_customer_id_fkey"
            columns: ["tenant_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "sires_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      supply_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          parent_id: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          parent_id?: string | null
          tenant_id?: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supply_categories_parent_id_fkey"
            columns: ["tenant_id", "parent_id"]
            isOneToOne: false
            referencedRelation: "supply_categories"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "supply_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      supply_inventory: {
        Row: {
          category_id: string | null
          cost_per_unit: number | null
          created_at: string | null
          expiration_date: string | null
          id: string
          item_name: string
          last_restock_date: string | null
          notes: string | null
          quantity: number
          reorder_threshold: number | null
          supplier_contact: string | null
          supplier_name: string | null
          tenant_id: string
          unit: string
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          cost_per_unit?: number | null
          created_at?: string | null
          expiration_date?: string | null
          id?: string
          item_name: string
          last_restock_date?: string | null
          notes?: string | null
          quantity: number
          reorder_threshold?: number | null
          supplier_contact?: string | null
          supplier_name?: string | null
          tenant_id?: string
          unit: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          cost_per_unit?: number | null
          created_at?: string | null
          expiration_date?: string | null
          id?: string
          item_name?: string
          last_restock_date?: string | null
          notes?: string | null
          quantity?: number
          reorder_threshold?: number | null
          supplier_contact?: string | null
          supplier_name?: string | null
          tenant_id?: string
          unit?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supply_inventory_category_id_fkey"
            columns: ["tenant_id", "category_id"]
            isOneToOne: false
            referencedRelation: "supply_categories"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "supply_inventory_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      supply_usage_log: {
        Row: {
          created_at: string | null
          id: string
          inventory_id: string
          notes: string | null
          quantity_used: number
          tenant_id: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          inventory_id: string
          notes?: string | null
          quantity_used: number
          tenant_id?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          inventory_id?: string
          notes?: string | null
          quantity_used?: number
          tenant_id?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supply_usage_log_inventory_id_fkey"
            columns: ["tenant_id", "inventory_id"]
            isOneToOne: false
            referencedRelation: "supply_inventory"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "supply_usage_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supply_usage_log_used_by_fkey"
            columns: ["tenant_id", "used_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      tanks: {
        Row: {
          capacity: number | null
          created_at: string | null
          id: string
          last_filled_date: string | null
          location: string | null
          low_level_threshold: number | null
          nitrogen_capacity: number | null
          nitrogen_level: number | null
          nitrogen_unit: string | null
          notes: string | null
          sort_order: number | null
          tank_name: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          id?: string
          last_filled_date?: string | null
          location?: string | null
          low_level_threshold?: number | null
          nitrogen_capacity?: number | null
          nitrogen_level?: number | null
          nitrogen_unit?: string | null
          notes?: string | null
          sort_order?: number | null
          tank_name: string
          tenant_id?: string
          updated_at?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          id?: string
          last_filled_date?: string | null
          location?: string | null
          low_level_threshold?: number | null
          nitrogen_capacity?: number | null
          nitrogen_level?: number | null
          nitrogen_unit?: string | null
          notes?: string | null
          sort_order?: number | null
          tank_name?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tanks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          legal_name: string | null
          login_hint: string | null
          logo_url: string | null
          name: string
          report_footer: string | null
          settings: Json
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          legal_name?: string | null
          login_hint?: string | null
          logo_url?: string | null
          name: string
          report_footer?: string | null
          settings?: Json
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          legal_name?: string | null
          login_hint?: string | null
          logo_url?: string | null
          name?: string
          report_footer?: string | null
          settings?: Json
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string | null
          dark_mode: boolean | null
          dashboard_tank_display_count: number | null
          dashboard_widgets: Json | null
          email_notifications_enabled: boolean | null
          id: string
          items_per_page: number | null
          medical_expiration_warning_days: number | null
          notification_email: string | null
          notify_low_medical_stock: boolean | null
          notify_low_nitrogen: boolean | null
          notify_periodic_reminder: boolean | null
          tenant_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dark_mode?: boolean | null
          dashboard_tank_display_count?: number | null
          dashboard_widgets?: Json | null
          email_notifications_enabled?: boolean | null
          id?: string
          items_per_page?: number | null
          medical_expiration_warning_days?: number | null
          notification_email?: string | null
          notify_low_medical_stock?: boolean | null
          notify_low_nitrogen?: boolean | null
          notify_periodic_reminder?: boolean | null
          tenant_id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          dark_mode?: boolean | null
          dashboard_tank_display_count?: number | null
          dashboard_widgets?: Json | null
          email_notifications_enabled?: boolean | null
          id?: string
          items_per_page?: number | null
          medical_expiration_warning_days?: number | null
          notification_email?: string | null
          notify_low_medical_stock?: boolean | null
          notify_low_nitrogen?: boolean | null
          notify_periodic_reminder?: boolean | null
          tenant_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      customer_inventory: {
        Row: {
          breed: string | null
          cane_number: string | null
          canister_id: string | null
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          embryo_name: string | null
          inventory_id: string | null
          inventory_type: string | null
          quantity: number | null
          sire_name: string | null
          status: string | null
          tank_id: string | null
          tank_name: string | null
        }
        Relationships: []
      }
      v_low_nitrogen_alerts: {
        Row: {
          low_level_threshold: number | null
          nitrogen_capacity: number | null
          nitrogen_level: number | null
          nitrogen_percentage: number | null
          tank_id: string | null
          tank_name: string | null
        }
        Insert: {
          low_level_threshold?: number | null
          nitrogen_capacity?: number | null
          nitrogen_level?: number | null
          nitrogen_percentage?: never
          tank_id?: string | null
          tank_name?: string | null
        }
        Update: {
          low_level_threshold?: number | null
          nitrogen_capacity?: number | null
          nitrogen_level?: number | null
          nitrogen_percentage?: never
          tank_id?: string | null
          tank_name?: string | null
        }
        Relationships: []
      }
      v_low_stock_alerts: {
        Row: {
          category_name: string | null
          item_id: string | null
          item_name: string | null
          quantity: number | null
          reorder_threshold: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_email_allowed: {
        Args: { check_email: string }
        Returns: {
          allowed: boolean
          full_name: string
        }[]
      }
      create_tenant_with_owner: {
        Args: {
          p_email: string
          p_full_name: string
          p_name: string
          p_slug: string
        }
        Returns: {
          error_code: string
          ok: boolean
          slug: string
        }[]
      }
      current_tenant_id: { Args: never; Returns: string }
      get_tenant_branding: {
        Args: { p_slug: string }
        Returns: {
          legal_name: string
          login_hint: string
          logo_url: string
          name: string
          report_footer: string
          slug: string
        }[]
      }
      insert_canister_at_position: {
        Args: { p_tank_id: string; target_position: number }
        Returns: undefined
      }
      insert_tank_at_position: {
        Args: { target_position: number }
        Returns: undefined
      }
      is_slug_available: { Args: { p_slug: string }; Returns: boolean }
      mark_email_used: { Args: { used_email: string }; Returns: undefined }
      normalize_canister_positions: {
        Args: { exclude_canister_id?: string; p_tank_id: string }
        Returns: undefined
      }
      normalize_tank_positions: {
        Args: { exclude_tank_id?: string }
        Returns: undefined
      }
      search_customers: {
        Args: {
          page_limit?: number
          page_offset?: number
          search_term?: string
          sort_ascending?: boolean
          sort_field?: string
        }
        Returns: {
          address: string
          created_at: string
          email: string
          id: string
          inventory_count: number
          name: string
          notes: string
          phone: string
          total_count: number
          updated_at: string
        }[]
      }
      search_genetic_inventory: {
        Args: {
          ivf_filter?: string
          owner_filter?: string
          page_limit?: number
          page_offset?: number
          search_term?: string
          sex_filter?: string
          status_filter?: string
          type_filter?: string
        }
        Returns: {
          breed: string
          cane_number: string
          canister_id: string
          canister_number: string
          check_in_date: string
          check_out_date: string
          created_at: string
          created_by: string
          customer_id: string
          customer_name: string
          embryo_name: string
          id: string
          inventory_type: string
          is_ivf: boolean
          notes: string
          original_quantity: number
          owner_type: string
          price_for_semen: number
          quantity: number
          sex_type: string
          sire_breed: string
          sire_id: string
          sire_name: string
          status: string
          tank_id: string
          tank_name: string
          total_count: number
          unit: string
          updated_at: string
          updated_by: string
        }[]
      }
      update_canister_position: {
        Args: {
          new_position: number
          old_position?: number
          p_canister_id: string
          p_tank_id: string
        }
        Returns: undefined
      }
      update_tank_position: {
        Args: { new_position: number; old_position?: number; tank_id: string }
        Returns: undefined
      }
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
