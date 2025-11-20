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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      broadcasts: {
        Row: {
          body: string
          created_at: string
          id: string
          image_url: string | null
          link_url: string | null
          sender_id: string
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          image_url?: string | null
          link_url?: string | null
          sender_id: string
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          image_url?: string | null
          link_url?: string | null
          sender_id?: string
          title?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          last_message_at: string | null
          product_id: string | null
          seller_id: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          product_id?: string | null
          seller_id: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          product_id?: string | null
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: string[] | null
          body: string | null
          conversation_id: string
          created_at: string
          id: string
          message_type: Database["public"]["Enums"]["message_type"]
          read_at: string | null
          sender_id: string
        }
        Insert: {
          attachments?: string[] | null
          body?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          message_type?: Database["public"]["Enums"]["message_type"]
          read_at?: string | null
          sender_id: string
        }
        Update: {
          attachments?: string[] | null
          body?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          message_type?: Database["public"]["Enums"]["message_type"]
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_appeals: {
        Row: {
          admin_response: string | null
          appeal_message: string
          created_at: string
          id: string
          moderation_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          appeal_message: string
          created_at?: string
          id?: string
          moderation_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          admin_response?: string | null
          appeal_message?: string
          created_at?: string
          id?: string
          moderation_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_appeals_moderation_id_fkey"
            columns: ["moderation_id"]
            isOneToOne: false
            referencedRelation: "user_moderation"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          image_url: string | null
          link_url: string | null
          metadata: Json | null
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          image_url?: string | null
          link_url?: string | null
          metadata?: Json | null
          read_at?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          image_url?: string | null
          link_url?: string | null
          metadata?: Json | null
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          buyer_id: string
          created_at: string
          delivery_name: string | null
          delivery_notes: string | null
          delivery_phone: string | null
          dispute_opened_at: string | null
          dispute_reason: string | null
          escrow_amount: number | null
          escrow_status: string | null
          id: string
          product_id: string
          quantity: number
          seller_id: string
          shipping_address: string | null
          shipping_city: string | null
          shipping_country: string | null
          shipping_region: string | null
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          delivery_name?: string | null
          delivery_notes?: string | null
          delivery_phone?: string | null
          dispute_opened_at?: string | null
          dispute_reason?: string | null
          escrow_amount?: number | null
          escrow_status?: string | null
          id?: string
          product_id: string
          quantity?: number
          seller_id: string
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_region?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_amount: number
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          delivery_name?: string | null
          delivery_notes?: string | null
          delivery_phone?: string | null
          dispute_opened_at?: string | null
          dispute_reason?: string | null
          escrow_amount?: number | null
          escrow_status?: string | null
          id?: string
          product_id?: string
          quantity?: number
          seller_id?: string
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_region?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_views: {
        Row: {
          id: string
          product_id: string
          search_query: string | null
          user_id: string | null
          viewed_at: string | null
        }
        Insert: {
          id?: string
          product_id: string
          search_query?: string | null
          user_id?: string | null
          viewed_at?: string | null
        }
        Update: {
          id?: string
          product_id?: string
          search_query?: string | null
          user_id?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_views_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand: string | null
          category: string
          category_cards: string[] | null
          condition: string | null
          created_at: string
          custom_labels: string[] | null
          description: string | null
          eco_badges: string[] | null
          enhancement_tags: string[] | null
          hs_code: string | null
          id: string
          images: string[]
          included_in_box: string[] | null
          inquiry_only: boolean | null
          material: string | null
          model_number: string | null
          moq: number | null
          origin: string | null
          perks: Json | null
          price: number
          product_code: string
          product_highlights: string[] | null
          product_requirements: string | null
          product_type: string | null
          product_video_url: string | null
          published: boolean | null
          replacement_available: boolean | null
          safety_tags: string[] | null
          search_phrases: string[] | null
          seller_story: string | null
          seo_keywords: string[] | null
          shipping_details: Json | null
          spin_images: string[] | null
          store_id: string
          support_contact: string | null
          tags: string[] | null
          target_audience: string[] | null
          technical_specs: Json | null
          title: string
          updated_at: string
          variants: Json | null
          warranty: string | null
          warranty_type: string | null
        }
        Insert: {
          brand?: string | null
          category: string
          category_cards?: string[] | null
          condition?: string | null
          created_at?: string
          custom_labels?: string[] | null
          description?: string | null
          eco_badges?: string[] | null
          enhancement_tags?: string[] | null
          hs_code?: string | null
          id?: string
          images?: string[]
          included_in_box?: string[] | null
          inquiry_only?: boolean | null
          material?: string | null
          model_number?: string | null
          moq?: number | null
          origin?: string | null
          perks?: Json | null
          price: number
          product_code?: string
          product_highlights?: string[] | null
          product_requirements?: string | null
          product_type?: string | null
          product_video_url?: string | null
          published?: boolean | null
          replacement_available?: boolean | null
          safety_tags?: string[] | null
          search_phrases?: string[] | null
          seller_story?: string | null
          seo_keywords?: string[] | null
          shipping_details?: Json | null
          spin_images?: string[] | null
          store_id: string
          support_contact?: string | null
          tags?: string[] | null
          target_audience?: string[] | null
          technical_specs?: Json | null
          title: string
          updated_at?: string
          variants?: Json | null
          warranty?: string | null
          warranty_type?: string | null
        }
        Update: {
          brand?: string | null
          category?: string
          category_cards?: string[] | null
          condition?: string | null
          created_at?: string
          custom_labels?: string[] | null
          description?: string | null
          eco_badges?: string[] | null
          enhancement_tags?: string[] | null
          hs_code?: string | null
          id?: string
          images?: string[]
          included_in_box?: string[] | null
          inquiry_only?: boolean | null
          material?: string | null
          model_number?: string | null
          moq?: number | null
          origin?: string | null
          perks?: Json | null
          price?: number
          product_code?: string
          product_highlights?: string[] | null
          product_requirements?: string | null
          product_type?: string | null
          product_video_url?: string | null
          published?: boolean | null
          replacement_available?: boolean | null
          safety_tags?: string[] | null
          search_phrases?: string[] | null
          seller_story?: string | null
          seo_keywords?: string[] | null
          shipping_details?: Json | null
          spin_images?: string[] | null
          store_id?: string
          support_contact?: string | null
          tags?: string[] | null
          target_audience?: string[] | null
          technical_specs?: Json | null
          title?: string
          updated_at?: string
          variants?: Json | null
          warranty?: string | null
          warranty_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string
          id: string
          language: string | null
          name: string | null
          notification_preferences: Json | null
          phone: string | null
          region: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email: string
          id: string
          language?: string | null
          name?: string | null
          notification_preferences?: Json | null
          phone?: string | null
          region?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string
          id?: string
          language?: string | null
          name?: string | null
          notification_preferences?: Json | null
          phone?: string | null
          region?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      seller_applications: {
        Row: {
          bank_account_name: string | null
          bank_account_number: string | null
          bank_name: string | null
          business_category: string
          business_cert_url: string | null
          business_description: string | null
          business_name: string
          business_registration_number: string | null
          contact_email: string
          contact_person: string
          contact_phone: string
          created_at: string
          how_heard_about: string | null
          id: string
          id_back_url: string | null
          id_front_url: string | null
          proof_of_address_url: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          status: Database["public"]["Enums"]["application_status"]
          store_address: string | null
          store_banner_url: string | null
          store_city: string | null
          store_country: string | null
          store_description: string | null
          store_logo_url: string | null
          store_name: string | null
          store_region: string | null
          tax_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          business_category: string
          business_cert_url?: string | null
          business_description?: string | null
          business_name: string
          business_registration_number?: string | null
          contact_email: string
          contact_person: string
          contact_phone: string
          created_at?: string
          how_heard_about?: string | null
          id?: string
          id_back_url?: string | null
          id_front_url?: string | null
          proof_of_address_url?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          store_address?: string | null
          store_banner_url?: string | null
          store_city?: string | null
          store_country?: string | null
          store_description?: string | null
          store_logo_url?: string | null
          store_name?: string | null
          store_region?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          business_category?: string
          business_cert_url?: string | null
          business_description?: string | null
          business_name?: string
          business_registration_number?: string | null
          contact_email?: string
          contact_person?: string
          contact_phone?: string
          created_at?: string
          how_heard_about?: string | null
          id?: string
          id_back_url?: string | null
          id_front_url?: string | null
          proof_of_address_url?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          store_address?: string | null
          store_banner_url?: string | null
          store_city?: string | null
          store_country?: string | null
          store_description?: string | null
          store_logo_url?: string | null
          store_name?: string | null
          store_region?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stores: {
        Row: {
          banner_url: string | null
          city: string | null
          country: string | null
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          owner_id: string
          region: string | null
          store_name: string
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          owner_id: string
          region?: string | null
          store_name: string
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          owner_id?: string
          region?: string | null
          store_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          metadata: Json | null
          reference: string | null
          status: string
          type: Database["public"]["Enums"]["transaction_type"]
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          metadata?: Json | null
          reference?: string | null
          status?: string
          type: Database["public"]["Enums"]["transaction_type"]
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          metadata?: Json | null
          reference?: string | null
          status?: string
          type?: Database["public"]["Enums"]["transaction_type"]
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_moderation: {
        Row: {
          admin_id: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          reason: string
          starts_at: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          reason: string
          starts_at?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          reason?: string
          starts_at?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          id: string
          phone_number: string
          reference_number: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          screenshot_url: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          id?: string
          phone_number: string
          reference_number?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_url?: string | null
          status?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          id?: string
          phone_number?: string
          reference_number?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_url?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance_leones: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance_leones?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance_leones?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "buyer" | "seller" | "admin"
      application_status: "pending" | "approved" | "rejected"
      message_type: "text" | "image" | "file" | "action"
      notification_type: "order" | "message" | "broadcast" | "system"
      order_status:
        | "pending"
        | "processing"
        | "packed"
        | "shipped"
        | "delivered"
        | "completed"
        | "disputed"
        | "cancelled"
      transaction_type: "deposit" | "withdrawal" | "earning" | "refund"
      user_role: "buyer" | "seller" | "admin"
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
    Enums: {
      app_role: ["buyer", "seller", "admin"],
      application_status: ["pending", "approved", "rejected"],
      message_type: ["text", "image", "file", "action"],
      notification_type: ["order", "message", "broadcast", "system"],
      order_status: [
        "pending",
        "processing",
        "packed",
        "shipped",
        "delivered",
        "completed",
        "disputed",
        "cancelled",
      ],
      transaction_type: ["deposit", "withdrawal", "earning", "refund"],
      user_role: ["buyer", "seller", "admin"],
    },
  },
} as const
