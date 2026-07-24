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
      ad_campaigns: {
        Row: {
          ad_copy: string | null
          budget_cents: number | null
          created_at: string
          creative_url: string | null
          end_date: string | null
          external_id: string | null
          id: string
          name: string
          network: string
          notes: string | null
          objective: string | null
          spend_cents: number | null
          start_date: string | null
          status: string
          target_url: string | null
          updated_at: string
          utm_campaign: string | null
        }
        Insert: {
          ad_copy?: string | null
          budget_cents?: number | null
          created_at?: string
          creative_url?: string | null
          end_date?: string | null
          external_id?: string | null
          id?: string
          name: string
          network: string
          notes?: string | null
          objective?: string | null
          spend_cents?: number | null
          start_date?: string | null
          status?: string
          target_url?: string | null
          updated_at?: string
          utm_campaign?: string | null
        }
        Update: {
          ad_copy?: string | null
          budget_cents?: number | null
          created_at?: string
          creative_url?: string | null
          end_date?: string | null
          external_id?: string | null
          id?: string
          name?: string
          network?: string
          notes?: string | null
          objective?: string | null
          spend_cents?: number | null
          start_date?: string | null
          status?: string
          target_url?: string | null
          updated_at?: string
          utm_campaign?: string | null
        }
        Relationships: []
      }
      ad_events: {
        Row: {
          created_at: string
          currency: string | null
          event_type: string
          id: string
          network: string | null
          order_id: string | null
          referrer: string | null
          url: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          value_cents: number | null
        }
        Insert: {
          created_at?: string
          currency?: string | null
          event_type: string
          id?: string
          network?: string | null
          order_id?: string | null
          referrer?: string | null
          url?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          value_cents?: number | null
        }
        Update: {
          created_at?: string
          currency?: string | null
          event_type?: string
          id?: string
          network?: string | null
          order_id?: string | null
          referrer?: string | null
          url?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          value_cents?: number | null
        }
        Relationships: []
      }
      ad_pixels: {
        Row: {
          enabled: boolean
          extra: Json
          id: string
          network: string
          pixel_id: string | null
          updated_at: string
        }
        Insert: {
          enabled?: boolean
          extra?: Json
          id?: string
          network: string
          pixel_id?: string | null
          updated_at?: string
        }
        Update: {
          enabled?: boolean
          extra?: Json
          id?: string
          network?: string
          pixel_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ad_utm_links: {
        Row: {
          campaign_id: string | null
          clicks: number
          created_at: string
          full_url: string
          id: string
          name: string
          target_url: string
          utm_campaign: string
          utm_content: string | null
          utm_medium: string
          utm_source: string
          utm_term: string | null
        }
        Insert: {
          campaign_id?: string | null
          clicks?: number
          created_at?: string
          full_url: string
          id?: string
          name: string
          target_url: string
          utm_campaign: string
          utm_content?: string | null
          utm_medium: string
          utm_source: string
          utm_term?: string | null
        }
        Update: {
          campaign_id?: string | null
          clicks?: number
          created_at?: string
          full_url?: string
          id?: string
          name?: string
          target_url?: string
          utm_campaign?: string
          utm_content?: string | null
          utm_medium?: string
          utm_source?: string
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_utm_links_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          auto_post_facebook_enabled: boolean
          id: string
          social_webhook_url: string | null
          updated_at: string
        }
        Insert: {
          auto_post_facebook_enabled?: boolean
          id?: string
          social_webhook_url?: string | null
          updated_at?: string
        }
        Update: {
          auto_post_facebook_enabled?: boolean
          id?: string
          social_webhook_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      authors: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          credentials: string | null
          email: string | null
          expertise: string[] | null
          id: string
          name: string
          slug: string
          social: Json | null
          updated_at: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          credentials?: string | null
          email?: string | null
          expertise?: string[] | null
          id?: string
          name: string
          slug: string
          social?: Json | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          credentials?: string | null
          email?: string | null
          expertise?: string[] | null
          id?: string
          name?: string
          slug?: string
          social?: Json | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      blog_clicks: {
        Row: {
          clicked_at: string
          id: string
          post_id: string | null
          product_handle: string | null
          product_id: string | null
          ref_code: string | null
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          clicked_at?: string
          id?: string
          post_id?: string | null
          product_handle?: string | null
          product_id?: string | null
          ref_code?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          clicked_at?: string
          id?: string
          post_id?: string | null
          product_handle?: string | null
          product_id?: string | null
          ref_code?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_clicks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_conversions: {
        Row: {
          created_at: string
          currency: string
          customer_email: string | null
          id: string
          line_items: Json | null
          order_number: string | null
          ordered_at: string
          post_id: string | null
          ref_code: string | null
          shopify_order_id: string
          total_amount: number
        }
        Insert: {
          created_at?: string
          currency?: string
          customer_email?: string | null
          id?: string
          line_items?: Json | null
          order_number?: string | null
          ordered_at?: string
          post_id?: string | null
          ref_code?: string | null
          shopify_order_id: string
          total_amount?: number
        }
        Update: {
          created_at?: string
          currency?: string
          customer_email?: string | null
          id?: string
          line_items?: Json | null
          order_number?: string | null
          ordered_at?: string
          post_id?: string | null
          ref_code?: string | null
          shopify_order_id?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "blog_conversions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_link_issues: {
        Row: {
          created_at: string
          id: string
          issue_type: string
          last_checked_at: string
          post_id: string
          resolved_at: string | null
          status_code: number | null
          suggested_handle: string | null
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          issue_type: string
          last_checked_at?: string
          post_id: string
          resolved_at?: string | null
          status_code?: number | null
          suggested_handle?: string | null
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          issue_type?: string
          last_checked_at?: string
          post_id?: string
          resolved_at?: string | null
          status_code?: number | null
          suggested_handle?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_link_issues_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      bofu_keywords: {
        Row: {
          created_at: string
          difficulty: number | null
          id: string
          intent: string | null
          keyword: string
          page_id: string | null
          source: string | null
          status: string
          updated_at: string
          volume: number | null
        }
        Insert: {
          created_at?: string
          difficulty?: number | null
          id?: string
          intent?: string | null
          keyword: string
          page_id?: string | null
          source?: string | null
          status?: string
          updated_at?: string
          volume?: number | null
        }
        Update: {
          created_at?: string
          difficulty?: number | null
          id?: string
          intent?: string | null
          keyword?: string
          page_id?: string | null
          source?: string | null
          status?: string
          updated_at?: string
          volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bofu_keywords_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "bofu_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      bofu_pages: {
        Row: {
          author_id: string | null
          body_html: string | null
          city: string | null
          comparison_json: Json | null
          created_at: string
          faq_json: Json | null
          h1: string | null
          id: string
          intro: string | null
          keyword: string
          meta_description: string | null
          published_at: string | null
          slug: string
          status: string
          template: string
          title: string
          updated_at: string
          video_embed_html: string | null
          video_platform: string | null
          video_url: string | null
        }
        Insert: {
          author_id?: string | null
          body_html?: string | null
          city?: string | null
          comparison_json?: Json | null
          created_at?: string
          faq_json?: Json | null
          h1?: string | null
          id?: string
          intro?: string | null
          keyword: string
          meta_description?: string | null
          published_at?: string | null
          slug: string
          status?: string
          template: string
          title: string
          updated_at?: string
          video_embed_html?: string | null
          video_platform?: string | null
          video_url?: string | null
        }
        Update: {
          author_id?: string | null
          body_html?: string | null
          city?: string | null
          comparison_json?: Json | null
          created_at?: string
          faq_json?: Json | null
          h1?: string | null
          id?: string
          intro?: string | null
          keyword?: string
          meta_description?: string | null
          published_at?: string | null
          slug?: string
          status?: string
          template?: string
          title?: string
          updated_at?: string
          video_embed_html?: string | null
          video_platform?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      customer_addresses: {
        Row: {
          city: string
          country: string
          created_at: string
          id: string
          is_default: boolean
          label: string | null
          line1: string
          line2: string | null
          phone: string
          postal_code: string
          province: string
          recipient_name: string
          suburb: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          city: string
          country?: string
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string | null
          line1: string
          line2?: string | null
          phone: string
          postal_code: string
          province: string
          recipient_name: string
          suburb?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string | null
          line1?: string
          line2?: string | null
          phone?: string
          postal_code?: string
          province?: string
          recipient_name?: string
          suburb?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      order_events: {
        Row: {
          created_at: string
          created_by: string | null
          event_type: string
          id: string
          message: string | null
          metadata: Json | null
          order_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          event_type: string
          id?: string
          message?: string | null
          metadata?: Json | null
          order_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          event_type?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          line_total: number
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          sku: string | null
          unit_price: number
          variant_id: string | null
          variant_label: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          line_total: number
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          sku?: string | null
          unit_price: number
          variant_id?: string | null
          variant_label?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          line_total?: number
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          sku?: string | null
          unit_price?: number
          variant_id?: string | null
          variant_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          id: string
          internal_notes: string | null
          order_number: string
          paid_at: string | null
          payfast_payment_id: string | null
          payfast_token: string | null
          payment_mode: string
          payment_provider: string
          ship_city: string
          ship_country: string
          ship_line1: string
          ship_line2: string | null
          ship_postal_code: string
          ship_province: string
          ship_suburb: string | null
          shipping_amount: number
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total_amount: number
          tracking_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          id?: string
          internal_notes?: string | null
          order_number: string
          paid_at?: string | null
          payfast_payment_id?: string | null
          payfast_token?: string | null
          payment_mode?: string
          payment_provider?: string
          ship_city: string
          ship_country?: string
          ship_line1: string
          ship_line2?: string | null
          ship_postal_code: string
          ship_province: string
          ship_suburb?: string | null
          shipping_amount?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total_amount: number
          tracking_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          id?: string
          internal_notes?: string | null
          order_number?: string
          paid_at?: string | null
          payfast_payment_id?: string | null
          payfast_token?: string | null
          payment_mode?: string
          payment_provider?: string
          ship_city?: string
          ship_country?: string
          ship_line1?: string
          ship_line2?: string | null
          ship_postal_code?: string
          ship_province?: string
          ship_suburb?: string | null
          shipping_amount?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      post_views: {
        Row: {
          country: string | null
          id: string
          post_id: string
          referrer: string | null
          viewed_at: string
        }
        Insert: {
          country?: string | null
          id?: string
          post_id: string
          referrer?: string | null
          viewed_at?: string
        }
        Update: {
          country?: string | null
          id?: string
          post_id?: string
          referrer?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string | null
          category_id: string | null
          content: string
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          excerpt: string | null
          experience_notes: string | null
          id: string
          keywords: string | null
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          slug: string
          social_ping_at: string | null
          social_ping_error: string | null
          social_ping_status: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          category_id?: string | null
          content?: string
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          experience_notes?: string | null
          id?: string
          keywords?: string | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug: string
          social_ping_at?: string | null
          social_ping_error?: string | null
          social_ping_status?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          category_id?: string | null
          content?: string
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          experience_notes?: string | null
          id?: string
          keywords?: string | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug?: string
          social_ping_at?: string | null
          social_ping_error?: string | null
          social_ping_status?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      quote_requests: {
        Row: {
          created_at: string
          currency_code: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          estimated_total: number | null
          id: string
          item_count: number
          items: Json
          message: string | null
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency_code?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          estimated_total?: number | null
          id?: string
          item_count?: number
          items?: Json
          message?: string | null
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency_code?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          estimated_total?: number | null
          id?: string
          item_count?: number
          items?: Json
          message?: string | null
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      route_meta: {
        Row: {
          canonical: string | null
          created_at: string
          description: string | null
          og_image: string | null
          slug: string
          title: string | null
          updated_at: string
        }
        Insert: {
          canonical?: string | null
          created_at?: string
          description?: string | null
          og_image?: string | null
          slug: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          canonical?: string | null
          created_at?: string
          description?: string | null
          og_image?: string | null
          slug?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      seo_keywords: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          keyword: string
          notes: string | null
          priority: number
          status: string
          target_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          keyword: string
          notes?: string | null
          priority?: number
          status?: string
          target_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          keyword?: string
          notes?: string | null
          priority?: number
          status?: string
          target_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      seo_submissions: {
        Row: {
          google_ping_ok: boolean
          google_ping_status: number | null
          id: string
          indexing_checked_at: string | null
          indexing_coverage: string | null
          indexing_state: string | null
          indexnow_ok: boolean
          indexnow_status: number | null
          post_id: string | null
          submitted_at: string
          url: string
        }
        Insert: {
          google_ping_ok?: boolean
          google_ping_status?: number | null
          id?: string
          indexing_checked_at?: string | null
          indexing_coverage?: string | null
          indexing_state?: string | null
          indexnow_ok?: boolean
          indexnow_status?: number | null
          post_id?: string | null
          submitted_at?: string
          url: string
        }
        Update: {
          google_ping_ok?: boolean
          google_ping_status?: number | null
          id?: string
          indexing_checked_at?: string | null
          indexing_coverage?: string | null
          indexing_state?: string | null
          indexnow_ok?: boolean
          indexnow_status?: number | null
          post_id?: string | null
          submitted_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_submissions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
          position: number
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          position?: number
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          position?: number
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "shop_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_product_branding_options: {
        Row: {
          branding_size: string | null
          branding_type: string
          created_at: string
          id: string
          max_colour_count: number | null
          position: string | null
          product_id: string
          setup_fee: number
          sort_order: number
          unit_cost: number
          updated_at: string
        }
        Insert: {
          branding_size?: string | null
          branding_type: string
          created_at?: string
          id?: string
          max_colour_count?: number | null
          position?: string | null
          product_id: string
          setup_fee?: number
          sort_order?: number
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          branding_size?: string | null
          branding_type?: string
          created_at?: string
          id?: string
          max_colour_count?: number | null
          position?: string | null
          product_id?: string
          setup_fee?: number
          sort_order?: number
          unit_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_product_branding_options_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "shop_products"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_product_images: {
        Row: {
          alt: string | null
          created_at: string
          id: string
          position: number
          product_id: string
          url: string
        }
        Insert: {
          alt?: string | null
          created_at?: string
          id?: string
          position?: number
          product_id: string
          url: string
        }
        Update: {
          alt?: string | null
          created_at?: string
          id?: string
          position?: number
          product_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "shop_products"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_product_variants: {
        Row: {
          available: boolean
          created_at: string
          currency_code: string
          hex_code: string | null
          id: string
          image_url: string | null
          option1_name: string | null
          option1_value: string | null
          option2_name: string | null
          option2_value: string | null
          option3_name: string | null
          option3_value: string | null
          position: number
          price: number
          product_id: string
          sku: string | null
          stock: number
          updated_at: string
        }
        Insert: {
          available?: boolean
          created_at?: string
          currency_code?: string
          hex_code?: string | null
          id?: string
          image_url?: string | null
          option1_name?: string | null
          option1_value?: string | null
          option2_name?: string | null
          option2_value?: string | null
          option3_name?: string | null
          option3_value?: string | null
          position?: number
          price: number
          product_id: string
          sku?: string | null
          stock?: number
          updated_at?: string
        }
        Update: {
          available?: boolean
          created_at?: string
          currency_code?: string
          hex_code?: string | null
          id?: string
          image_url?: string | null
          option1_name?: string | null
          option1_value?: string | null
          option2_name?: string | null
          option2_value?: string | null
          option3_name?: string | null
          option3_value?: string | null
          position?: number
          price?: number
          product_id?: string
          sku?: string | null
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "shop_products"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_products: {
        Row: {
          base_price: number | null
          brand: string | null
          category_id: string | null
          collection: string
          created_at: string
          currency_code: string
          description: string | null
          handle: string
          id: string
          meta_description: string | null
          meta_title: string | null
          position: number
          product_features: string | null
          status: string
          supplier_item_number: string | null
          title: string
          updated_at: string
        }
        Insert: {
          base_price?: number | null
          brand?: string | null
          category_id?: string | null
          collection?: string
          created_at?: string
          currency_code?: string
          description?: string | null
          handle: string
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          position?: number
          product_features?: string | null
          status?: string
          supplier_item_number?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          base_price?: number | null
          brand?: string | null
          category_id?: string | null
          collection?: string
          created_at?: string
          currency_code?: string
          description?: string | null
          handle?: string
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          position?: number
          product_features?: string | null
          status?: string
          supplier_item_number?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "shop_categories"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Views: {
      authors_public: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          credentials: string | null
          expertise: string[] | null
          id: string | null
          name: string | null
          slug: string | null
          social: Json | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          credentials?: string | null
          expertise?: string[] | null
          id?: string | null
          name?: string | null
          slug?: string | null
          social?: Json | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          credentials?: string | null
          expertise?: string[] | null
          id?: string | null
          name?: string | null
          slug?: string | null
          social?: Json | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      generate_order_number: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      order_status:
        | "pending_payment"
        | "paid"
        | "in_production"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded"
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
      app_role: ["admin", "user"],
      order_status: [
        "pending_payment",
        "paid",
        "in_production",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
    },
  },
} as const
