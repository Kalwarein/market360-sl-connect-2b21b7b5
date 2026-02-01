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
      delivery_qr_codes: {
        Row: {
          buyer_id: string
          created_at: string
          encrypted_token: string
          expires_at: string
          id: string
          order_id: string
          scanned_at: string | null
          seller_id: string
          status: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          encrypted_token: string
          expires_at: string
          id?: string
          order_id: string
          scanned_at?: string | null
          seller_id: string
          status?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          encrypted_token?: string
          expires_at?: string
          id?: string
          order_id?: string
          scanned_at?: string | null
          seller_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_qr_codes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_activity_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_type: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      fraud_alerts: {
        Row: {
          alert_type: string
          created_at: string
          description: string
          id: string
          metadata: Json | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachments: string[] | null
          body: string | null
          conversation_id: string
          created_at: string
          delivered_at: string | null
          id: string
          message_type: Database["public"]["Enums"]["message_type"]
          read_at: string | null
          reply_to_message_id: string | null
          sender_id: string
          status: string | null
        }
        Insert: {
          attachments?: string[] | null
          body?: string | null
          conversation_id: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          message_type?: Database["public"]["Enums"]["message_type"]
          read_at?: string | null
          reply_to_message_id?: string | null
          sender_id: string
          status?: string | null
        }
        Update: {
          attachments?: string[] | null
          body?: string | null
          conversation_id?: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          message_type?: Database["public"]["Enums"]["message_type"]
          read_at?: string | null
          reply_to_message_id?: string | null
          sender_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_message_id_fkey"
            columns: ["reply_to_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
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
          order_batch_ref: string | null
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
          order_batch_ref?: string | null
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
          order_batch_ref?: string | null
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
      platform_analytics: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          metric_count: number
          metric_date: string
          metric_type: string
          metric_value: number
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_count?: number
          metric_date: string
          metric_type: string
          metric_value?: number
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_count?: number
          metric_date?: string
          metric_type?: string
          metric_value?: number
        }
        Relationships: []
      }
      product_moderation: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          product_id: string
          reason: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          product_id: string
          reason: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          product_id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_moderation_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          created_at: string | null
          helpful_count: number | null
          id: string
          product_id: string
          rating: number
          review_images: string[] | null
          review_text: string | null
          updated_at: string | null
          user_id: string
          verified_purchase: boolean | null
        }
        Insert: {
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          product_id: string
          rating: number
          review_images?: string[] | null
          review_text?: string | null
          updated_at?: string | null
          user_id: string
          verified_purchase?: boolean | null
        }
        Update: {
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          product_id?: string
          rating?: number
          review_images?: string[] | null
          review_text?: string | null
          updated_at?: string | null
          user_id?: string
          verified_purchase?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
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
          is_promoted: boolean | null
          material: string | null
          model_number: string | null
          moq: number | null
          orders_count: number | null
          origin: string | null
          perks: Json | null
          price: number
          product_code: string
          product_highlights: string[] | null
          product_requirements: string | null
          product_type: string | null
          product_video_url: string | null
          promoted_until: string | null
          published: boolean | null
          replacement_available: boolean | null
          safety_tags: string[] | null
          saves_count: number | null
          scheduled_deletion_at: string | null
          search_phrases: string[] | null
          seller_story: string | null
          seo_keywords: string[] | null
          shipping_details: Json | null
          spin_images: string[] | null
          status: string
          store_id: string
          support_contact: string | null
          suspended_at: string | null
          suspended_by: string | null
          suspension_reason: string | null
          tags: string[] | null
          target_audience: string[] | null
          technical_specs: Json | null
          title: string
          updated_at: string
          variants: Json | null
          views_count: number | null
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
          is_promoted?: boolean | null
          material?: string | null
          model_number?: string | null
          moq?: number | null
          orders_count?: number | null
          origin?: string | null
          perks?: Json | null
          price: number
          product_code?: string
          product_highlights?: string[] | null
          product_requirements?: string | null
          product_type?: string | null
          product_video_url?: string | null
          promoted_until?: string | null
          published?: boolean | null
          replacement_available?: boolean | null
          safety_tags?: string[] | null
          saves_count?: number | null
          scheduled_deletion_at?: string | null
          search_phrases?: string[] | null
          seller_story?: string | null
          seo_keywords?: string[] | null
          shipping_details?: Json | null
          spin_images?: string[] | null
          status?: string
          store_id: string
          support_contact?: string | null
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          tags?: string[] | null
          target_audience?: string[] | null
          technical_specs?: Json | null
          title: string
          updated_at?: string
          variants?: Json | null
          views_count?: number | null
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
          is_promoted?: boolean | null
          material?: string | null
          model_number?: string | null
          moq?: number | null
          orders_count?: number | null
          origin?: string | null
          perks?: Json | null
          price?: number
          product_code?: string
          product_highlights?: string[] | null
          product_requirements?: string | null
          product_type?: string | null
          product_video_url?: string | null
          promoted_until?: string | null
          published?: boolean | null
          replacement_available?: boolean | null
          safety_tags?: string[] | null
          saves_count?: number | null
          scheduled_deletion_at?: string | null
          search_phrases?: string[] | null
          seller_story?: string | null
          seo_keywords?: string[] | null
          shipping_details?: Json | null
          spin_images?: string[] | null
          status?: string
          store_id?: string
          support_contact?: string | null
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          tags?: string[] | null
          target_audience?: string[] | null
          technical_specs?: Json | null
          title?: string
          updated_at?: string
          variants?: Json | null
          views_count?: number | null
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
          bio: string | null
          city: string | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          full_name: string | null
          gender: string | null
          id: string
          interests: string[] | null
          is_online: boolean | null
          language: string | null
          last_seen: string | null
          name: string | null
          notification_preferences: Json | null
          occupation: string | null
          onboarding_completed: boolean | null
          onboarding_tour_completed: boolean | null
          onesignal_player_id: string | null
          phone: string | null
          phone_verification_code: string | null
          phone_verification_expires_at: string | null
          phone_verified: boolean | null
          pin_attempts: number | null
          pin_enabled: boolean | null
          pin_hash: string | null
          pin_locked_until: string | null
          recovery_code_generated_at: string | null
          recovery_code1_hash: string | null
          recovery_code2_hash: string | null
          recovery_regeneration_count: number | null
          recovery_regeneration_month: number | null
          recovery_setup_completed: boolean | null
          region: string | null
          role: Database["public"]["Enums"]["user_role"]
          school_name: string | null
          street_address: string | null
          university_name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          full_name?: string | null
          gender?: string | null
          id: string
          interests?: string[] | null
          is_online?: boolean | null
          language?: string | null
          last_seen?: string | null
          name?: string | null
          notification_preferences?: Json | null
          occupation?: string | null
          onboarding_completed?: boolean | null
          onboarding_tour_completed?: boolean | null
          onesignal_player_id?: string | null
          phone?: string | null
          phone_verification_code?: string | null
          phone_verification_expires_at?: string | null
          phone_verified?: boolean | null
          pin_attempts?: number | null
          pin_enabled?: boolean | null
          pin_hash?: string | null
          pin_locked_until?: string | null
          recovery_code_generated_at?: string | null
          recovery_code1_hash?: string | null
          recovery_code2_hash?: string | null
          recovery_regeneration_count?: number | null
          recovery_regeneration_month?: number | null
          recovery_setup_completed?: boolean | null
          region?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          school_name?: string | null
          street_address?: string | null
          university_name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          full_name?: string | null
          gender?: string | null
          id?: string
          interests?: string[] | null
          is_online?: boolean | null
          language?: string | null
          last_seen?: string | null
          name?: string | null
          notification_preferences?: Json | null
          occupation?: string | null
          onboarding_completed?: boolean | null
          onboarding_tour_completed?: boolean | null
          onesignal_player_id?: string | null
          phone?: string | null
          phone_verification_code?: string | null
          phone_verification_expires_at?: string | null
          phone_verified?: boolean | null
          pin_attempts?: number | null
          pin_enabled?: boolean | null
          pin_hash?: string | null
          pin_locked_until?: string | null
          recovery_code_generated_at?: string | null
          recovery_code1_hash?: string | null
          recovery_code2_hash?: string | null
          recovery_regeneration_count?: number | null
          recovery_regeneration_month?: number | null
          recovery_setup_completed?: boolean | null
          region?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          school_name?: string | null
          street_address?: string | null
          university_name?: string | null
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
      qr_scan_logs: {
        Row: {
          error_message: string | null
          id: string
          metadata: Json | null
          order_id: string
          qr_id: string | null
          scan_result: string
          scanned_at: string
          seller_id: string
        }
        Insert: {
          error_message?: string | null
          id?: string
          metadata?: Json | null
          order_id: string
          qr_id?: string | null
          scan_result: string
          scanned_at?: string
          seller_id: string
        }
        Update: {
          error_message?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string
          qr_id?: string | null
          scan_result?: string
          scanned_at?: string
          seller_id?: string
        }
        Relationships: []
      }
      recovery_attempts: {
        Row: {
          attempt_type: string
          created_at: string
          email: string
          id: string
          ip_address: string | null
          success: boolean
          user_agent: string | null
        }
        Insert: {
          attempt_type: string
          created_at?: string
          email: string
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Update: {
          attempt_type?: string
          created_at?: string
          email?: string
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      review_votes: {
        Row: {
          created_at: string | null
          id: string
          is_helpful: boolean
          review_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_helpful: boolean
          review_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_helpful?: boolean
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "product_reviews"
            referencedColumns: ["id"]
          },
        ]
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
      store_moderation: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          reason: string
          store_id: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          reason: string
          store_id: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          reason?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_moderation_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_moderation_appeals: {
        Row: {
          admin_response: string | null
          appeal_message: string
          created_at: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          store_id: string
          store_moderation_id: string | null
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          appeal_message: string
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          store_id: string
          store_moderation_id?: string | null
          user_id: string
        }
        Update: {
          admin_response?: string | null
          appeal_message?: string
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          store_id?: string
          store_moderation_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_moderation_appeals_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_moderation_appeals_store_moderation_id_fkey"
            columns: ["store_moderation_id"]
            isOneToOne: false
            referencedRelation: "store_moderation"
            referencedColumns: ["id"]
          },
        ]
      }
      store_perks: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          metadata: Json | null
          perk_name: string
          perk_type: string
          price_paid: number
          purchased_at: string
          store_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          perk_name: string
          perk_type: string
          price_paid: number
          purchased_at?: string
          store_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          perk_name?: string
          perk_type?: string
          price_paid?: number
          purchased_at?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_perks_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_review_votes: {
        Row: {
          created_at: string | null
          id: string
          is_helpful: boolean
          review_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_helpful: boolean
          review_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_helpful?: boolean
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_review_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "store_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      store_reviews: {
        Row: {
          created_at: string | null
          helpful_count: number | null
          id: string
          rating: number
          review_images: string[] | null
          review_text: string | null
          store_id: string
          updated_at: string | null
          user_id: string
          verified_purchase: boolean | null
        }
        Insert: {
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          rating: number
          review_images?: string[] | null
          review_text?: string | null
          store_id: string
          updated_at?: string | null
          user_id: string
          verified_purchase?: boolean | null
        }
        Update: {
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          rating?: number
          review_images?: string[] | null
          review_text?: string | null
          store_id?: string
          updated_at?: string | null
          user_id?: string
          verified_purchase?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "store_reviews_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
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
          status: string
          store_name: string
          suspended_at: string | null
          suspended_by: string | null
          suspension_expires_at: string | null
          suspension_reason: string | null
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
          status?: string
          store_name: string
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_expires_at?: string | null
          suspension_reason?: string | null
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
          status?: string
          store_name?: string
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_expires_at?: string | null
          suspension_reason?: string | null
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
      user_reports: {
        Row: {
          action_taken: string | null
          admin_notes: string | null
          amount: number | null
          created_at: string
          description: string
          evidence_urls: string[] | null
          id: string
          order_id: string | null
          reported_user_id: string | null
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          seller_name: string | null
          status: string
          store_name: string | null
          updated_at: string
        }
        Insert: {
          action_taken?: string | null
          admin_notes?: string | null
          amount?: number | null
          created_at?: string
          description: string
          evidence_urls?: string[] | null
          id?: string
          order_id?: string | null
          reported_user_id?: string | null
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          seller_name?: string | null
          status?: string
          store_name?: string | null
          updated_at?: string
        }
        Update: {
          action_taken?: string | null
          admin_notes?: string | null
          amount?: number | null
          created_at?: string
          description?: string
          evidence_urls?: string[] | null
          id?: string
          order_id?: string | null
          reported_user_id?: string | null
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          seller_name?: string | null
          status?: string
          store_name?: string | null
          updated_at?: string
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
      wallet_admin_notes: {
        Row: {
          admin_id: string
          created_at: string
          id: string
          note: string
          note_type: string
          user_id: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          id?: string
          note: string
          note_type?: string
          user_id: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          id?: string
          note?: string
          note_type?: string
          user_id?: string
        }
        Relationships: []
      }
      wallet_freezes: {
        Row: {
          created_at: string
          frozen_at: string
          frozen_by: string
          id: string
          is_active: boolean
          reason: string
          unfrozen_at: string | null
          unfrozen_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          frozen_at?: string
          frozen_by: string
          id?: string
          is_active?: boolean
          reason: string
          unfrozen_at?: string | null
          unfrozen_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          frozen_at?: string
          frozen_by?: string
          id?: string
          is_active?: boolean
          reason?: string
          unfrozen_at?: string | null
          unfrozen_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      wallet_ledger: {
        Row: {
          amount: number
          created_at: string
          id: string
          metadata: Json | null
          monime_id: string | null
          monime_ussd_code: string | null
          provider: string | null
          reference: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          risk_flags: string[] | null
          risk_score: number | null
          status: string
          transaction_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          metadata?: Json | null
          monime_id?: string | null
          monime_ussd_code?: string | null
          provider?: string | null
          reference?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_flags?: string[] | null
          risk_score?: number | null
          status?: string
          transaction_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          metadata?: Json | null
          monime_id?: string | null
          monime_ussd_code?: string | null
          provider?: string | null
          reference?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_flags?: string[] | null
          risk_score?: number | null
          status?: string
          transaction_type?: string
          updated_at?: string
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
      webhook_events: {
        Row: {
          created_at: string
          event_id: string
          event_type: string
          id: string
          payload: Json
          processed_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          event_type: string
          id?: string
          payload: Json
          processed_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_and_deactivate_expired_moderations: {
        Args: never
        Returns: undefined
      }
      cleanup_expired_qr_codes: { Args: never; Returns: undefined }
      delete_expired_products: { Args: never; Returns: undefined }
      detect_fraud_patterns: { Args: never; Returns: undefined }
      get_daily_transaction_volume: {
        Args: { days_back?: number }
        Returns: {
          deposits: number
          net_flow: number
          tx_count: number
          tx_date: string
          withdrawals: number
        }[]
      }
      get_platform_wallet_totals: {
        Args: never
        Returns: {
          flagged_users_count: number
          frozen_wallets_count: number
          pending_amount: number
          total_balance: number
          total_deposits: number
          total_earnings: number
          total_perks_revenue: number
          total_withdrawals: number
        }[]
      }
      get_wallet_balance: { Args: { p_user_id: string }; Returns: number }
      has_active_moderation: { Args: { user_uuid: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_wallet_frozen: { Args: { p_user_id: string }; Returns: boolean }
      place_order_batch: {
        Args: {
          p_buyer_id: string
          p_delivery_name: string
          p_delivery_notes: string
          p_delivery_phone: string
          p_idempotency_key: string
          p_items: Json
          p_shipping_address: string
          p_shipping_city: string
          p_shipping_country: string
          p_shipping_region: string
        }
        Returns: {
          order_ids: string[]
          total_amount: number
        }[]
      }
      validate_order_escrow_consistency: {
        Args: never
        Returns: {
          escrow_status: string
          issue: string
          ledger_amount: number
          order_amount: number
          order_id: string
        }[]
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
