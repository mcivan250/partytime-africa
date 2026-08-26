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
      announcements: {
        Row: {
          author_id: string
          body: string
          created_at: string
          event_id: string
          id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          event_id: string
          id?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          event_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      co_hosts: {
        Row: {
          can_edit: boolean
          event_id: string
          profile_id: string
          status: string
          created_at: string
        }
        Insert: {
          can_edit?: boolean
          event_id: string
          profile_id: string
          status?: string
          created_at?: string
        }
        Update: {
          can_edit?: boolean
          event_id?: string
          profile_id?: string
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "co_hosts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "co_hosts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          body: string
          created_at: string
          event_id: string
          id: string
          profile_id: string | null
          rsvp_id: string | null
        }
        Insert: {
          body: string
          created_at?: string
          event_id: string
          id?: string
          profile_id?: string | null
          rsvp_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          event_id?: string
          id?: string
          profile_id?: string | null
          rsvp_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_rsvp_id_fkey"
            columns: ["rsvp_id"]
            isOneToOne: false
            referencedRelation: "rsvps"
            referencedColumns: ["id"]
          },
        ]
      }
      event_answers: {
        Row: {
          answer: string
          id: string
          question_id: string
          rsvp_id: string
        }
        Insert: {
          answer: string
          id?: string
          question_id: string
          rsvp_id: string
        }
        Update: {
          answer?: string
          id?: string
          question_id?: string
          rsvp_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "event_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_answers_rsvp_id_fkey"
            columns: ["rsvp_id"]
            isOneToOne: false
            referencedRelation: "rsvps"
            referencedColumns: ["id"]
          },
        ]
      }
      event_polls: {
        Row: {
          closes_at: string | null
          event_id: string
          id: string
          question: string
        }
        Insert: {
          closes_at?: string | null
          event_id: string
          id?: string
          question?: string
        }
        Update: {
          closes_at?: string | null
          event_id?: string
          id?: string
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_polls_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_plus_ones: {
        Row: {
          claimed_at: string | null
          claimed_profile_id: string | null
          created_at: string
          event_id: string
          id: string
          invite_token: string
          inviter_name: string
          inviter_profile_id: string | null
          name: string
          rsvp_id: string | null
        }
        Insert: {
          claimed_at?: string | null
          claimed_profile_id?: string | null
          created_at?: string
          event_id: string
          id?: string
          invite_token?: string
          inviter_name?: string
          inviter_profile_id?: string | null
          name: string
          rsvp_id?: string | null
        }
        Update: {
          claimed_at?: string | null
          claimed_profile_id?: string | null
          created_at?: string
          event_id?: string
          id?: string
          invite_token?: string
          inviter_name?: string
          inviter_profile_id?: string | null
          name?: string
          rsvp_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_plus_ones_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_plus_ones_rsvp_id_fkey"
            columns: ["rsvp_id"]
            isOneToOne: false
            referencedRelation: "rsvps"
            referencedColumns: ["id"]
          },
        ]
      }
      event_questions: {
        Row: {
          event_id: string
          id: string
          options: Json | null
          position: number
          prompt: string
          qtype: Database["public"]["Enums"]["question_type"]
          required: boolean
        }
        Insert: {
          event_id: string
          id?: string
          options?: Json | null
          position?: number
          prompt: string
          qtype?: Database["public"]["Enums"]["question_type"]
          required?: boolean
        }
        Update: {
          event_id?: string
          id?: string
          options?: Json | null
          position?: number
          prompt?: string
          qtype?: Database["public"]["Enums"]["question_type"]
          required?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "event_questions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_reactions: {
        Row: {
          created_at: string
          emoji: string
          event_id: string
          id: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          emoji?: string
          event_id: string
          id?: string
          profile_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          event_id?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_reactions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_reactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          address: string | null
          allow_comments: boolean
          allow_guest_photos: boolean
          allow_plus_ones: boolean
          capacity: number | null
          cover_url: string | null
          created_at: string
          currency: string
          description: string | null
          ends_at: string | null
          featured: boolean
          guest_list_visible: boolean
          host_id: string
          id: string
          is_ticketed: boolean
          lat: number | null
          lng: number | null
          playlist_url: string | null
          promoter_bps: number
          rsvp_deadline: string | null
          slug: string
          sponsor_name: string | null
          starts_at: string | null
          status: Database["public"]["Enums"]["event_status"]
          theme: string
          timezone: string
          title: string
          venue_id: string | null
          venue_name: string | null
          visibility: Database["public"]["Enums"]["event_visibility"]
        }
        Insert: {
          address?: string | null
          allow_comments?: boolean
          allow_guest_photos?: boolean
          allow_plus_ones?: boolean
          capacity?: number | null
          cover_url?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          ends_at?: string | null
          featured?: boolean
          guest_list_visible?: boolean
          host_id: string
          id?: string
          is_ticketed?: boolean
          lat?: number | null
          lng?: number | null
          playlist_url?: string | null
          rsvp_deadline?: string | null
          slug: string
          sponsor_name?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          theme?: string
          timezone?: string
          title: string
          venue_id?: string | null
          venue_name?: string | null
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Update: {
          address?: string | null
          allow_comments?: boolean
          allow_guest_photos?: boolean
          capacity?: number | null
          cover_url?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          ends_at?: string | null
          featured?: boolean
          guest_list_visible?: boolean
          host_id?: string
          id?: string
          is_ticketed?: boolean
          lat?: number | null
          lng?: number | null
          playlist_url?: string | null
          rsvp_deadline?: string | null
          slug?: string
          sponsor_name?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          theme?: string
          timezone?: string
          title?: string
          venue_name?: string | null
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "events_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_messages: {
        Row: {
          id: string
          sender_id: string
          recipient_id: string
          body: string
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          recipient_id: string
          body: string
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          recipient_id?: string
          body?: string
          read_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      feed_posts: {
        Row: {
          id: string
          author_id: string
          city: string
          body: string
          tag: string | null
          image_path: string | null
          event_id: string | null
          like_count: number
          reply_count: number
          created_at: string
        }
        Insert: {
          id?: string
          author_id: string
          city?: string
          body: string
          tag?: string | null
          image_path?: string | null
          event_id?: string | null
          like_count?: number
          reply_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          author_id?: string
          city?: string
          body?: string
          tag?: string | null
          event_id?: string | null
          like_count?: number
          reply_count?: number
          created_at?: string
        }
        Relationships: []
      }
      feed_reactions: {
        Row: {
          post_id: string
          profile_id: string
          created_at: string
        }
        Insert: {
          post_id: string
          profile_id: string
          created_at?: string
        }
        Update: {
          post_id?: string
          profile_id?: string
          created_at?: string
        }
        Relationships: []
      }
      feed_replies: {
        Row: {
          id: string
          post_id: string
          author_id: string
          body: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          author_id: string
          body: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          author_id?: string
          body?: string
          created_at?: string
        }
        Relationships: []
      }
      merch_items: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          event_id: string
          id: string
          image_url: string | null
          name: string
          position: number
          price_minor: number
          status: string
        }
        Insert: {
          created_at?: string
          currency: string
          description?: string | null
          event_id: string
          id?: string
          image_url?: string | null
          name: string
          position?: number
          price_minor: number
          status?: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          event_id?: string
          id?: string
          image_url?: string | null
          name?: string
          position?: number
          price_minor?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "merch_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      merch_variants: {
        Row: {
          id: string
          inventory: number | null
          item_id: string
          label: string
          position: number
          sold: number
        }
        Insert: {
          id?: string
          inventory?: number | null
          item_id: string
          label?: string
          position?: number
          sold?: number
        }
        Update: {
          id?: string
          inventory?: number | null
          item_id?: string
          label?: string
          position?: number
          sold?: number
        }
        Relationships: [
          {
            foreignKeyName: "merch_variants_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "merch_items"
            referencedColumns: ["id"]
          },
        ]
      }
      merch_purchases: {
        Row: {
          buyer_name: string
          collected_at: string | null
          collected_by: string | null
          created_at: string
          event_id: string
          id: string
          item_id: string
          order_id: string
          qr_code: string
          quantity: number
          status: string
          variant_id: string
        }
        Insert: {
          buyer_name: string
          collected_at?: string | null
          collected_by?: string | null
          created_at?: string
          event_id: string
          id?: string
          item_id: string
          order_id: string
          qr_code?: string
          quantity?: number
          status?: string
          variant_id: string
        }
        Update: {
          buyer_name?: string
          collected_at?: string | null
          collected_by?: string | null
          created_at?: string
          event_id?: string
          id?: string
          item_id?: string
          order_id?: string
          qr_code?: string
          quantity?: number
          status?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "merch_purchases_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "merch_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merch_purchases_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "merch_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          ntype: string
          payload: Json
          profile_id: string
          read_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ntype: string
          payload?: Json
          profile_id: string
          read_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ntype?: string
          payload?: Json
          profile_id?: string
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount_minor: number
          buyer_name: string
          buyer_phone: string | null
          created_at: string
          currency: string
          event_id: string
          id: string
          kind: Database["public"]["Enums"]["order_kind"]
          profile_id: string | null
          provider: string
          provider_flw_id: string | null
          provider_tx_ref: string | null
          referral_code: string | null
          status: Database["public"]["Enums"]["order_status"]
          table_id: string | null
        }
        Insert: {
          amount_minor: number
          buyer_name: string
          buyer_phone?: string | null
          created_at?: string
          currency: string
          event_id: string
          id?: string
          kind: Database["public"]["Enums"]["order_kind"]
          profile_id?: string | null
          provider?: string
          provider_flw_id?: string | null
          provider_tx_ref?: string | null
          referral_code?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          table_id?: string | null
        }
        Update: {
          amount_minor?: number
          buyer_name?: string
          buyer_phone?: string | null
          created_at?: string
          currency?: string
          event_id?: string
          id?: string
          kind?: Database["public"]["Enums"]["order_kind"]
          profile_id?: string | null
          provider?: string
          provider_flw_id?: string | null
          provider_tx_ref?: string | null
          referral_code?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          table_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "venue_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount_minor: number
          created_at: string
          currency: string
          destination: string
          event_id: string
          host_id: string
          id: string
          provider_ref: string | null
          status: string
        }
        Insert: {
          amount_minor: number
          created_at?: string
          currency: string
          destination: string
          event_id: string
          host_id: string
          id?: string
          provider_ref?: string | null
          status?: string
        }
        Update: {
          amount_minor?: number
          created_at?: string
          currency?: string
          destination?: string
          event_id?: string
          host_id?: string
          id?: string
          provider_ref?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      photos: {
        Row: {
          created_at: string
          event_id: string
          id: string
          profile_id: string | null
          rsvp_id: string | null
          storage_path: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          profile_id?: string | null
          rsvp_id?: string | null
          storage_path: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          profile_id?: string | null
          rsvp_id?: string | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "photos_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_rsvp_id_fkey"
            columns: ["rsvp_id"]
            isOneToOne: false
            referencedRelation: "rsvps"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_options: {
        Row: {
          id: string
          label: string
          option_starts_at: string | null
          poll_id: string
        }
        Insert: {
          id?: string
          label: string
          option_starts_at?: string | null
          poll_id: string
        }
        Update: {
          id?: string
          label?: string
          option_starts_at?: string | null
          poll_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "event_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          id: string
          option_id: string
          rsvp_id: string
        }
        Insert: {
          id?: string
          option_id: string
          rsvp_id: string
        }
        Update: {
          id?: string
          option_id?: string
          rsvp_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_rsvp_id_fkey"
            columns: ["rsvp_id"]
            isOneToOne: false
            referencedRelation: "rsvps"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          country_code: string | null
          created_at: string
          currency: string | null
          display_name: string
          id: string
          phone: string | null
          phone_verified: boolean
          username: string | null
          wa_opt_in: boolean
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          country_code?: string | null
          created_at?: string
          currency?: string | null
          display_name: string
          id: string
          phone?: string | null
          phone_verified?: boolean
          username?: string | null
          wa_opt_in?: boolean
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          country_code?: string | null
          created_at?: string
          currency?: string | null
          display_name?: string
          id?: string
          phone?: string | null
          phone_verified?: boolean
          username?: string | null
          wa_opt_in?: boolean
        }
        Relationships: []
      }
      referral_earnings: {
        Row: {
          amount_minor: number
          created_at: string
          currency: string
          id: string
          order_id: string
          referral_id: string
          status: string
        }
        Insert: {
          amount_minor: number
          created_at?: string
          currency: string
          id?: string
          order_id: string
          referral_id: string
          status?: string
        }
        Update: {
          amount_minor?: number
          created_at?: string
          currency?: string
          id?: string
          order_id?: string
          referral_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_earnings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_earnings_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referral_links"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_links: {
        Row: {
          code: string
          commission_bps: number
          created_at: string
          event_id: string
          id: string
          promoter_id: string
        }
        Insert: {
          code: string
          commission_bps?: number
          created_at?: string
          event_id: string
          id?: string
          promoter_id: string
        }
        Update: {
          code?: string
          commission_bps?: number
          created_at?: string
          event_id?: string
          id?: string
          promoter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_links_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_links_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          event_id: string
          id: string
          kind: string
          send_at: string
          sent_at: string | null
        }
        Insert: {
          event_id: string
          id?: string
          kind: string
          send_at: string
          sent_at?: string | null
        }
        Update: {
          event_id?: string
          id?: string
          kind?: string
          send_at?: string
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reminders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      rsvps: {
        Row: {
          created_at: string
          edit_token: string
          event_id: string
          guest_name: string
          guest_phone: string | null
          id: string
          plus_ones: number
          profile_id: string | null
          status: Database["public"]["Enums"]["rsvp_status"]
          waitlisted: boolean
        }
        Insert: {
          created_at?: string
          edit_token?: string
          event_id: string
          guest_name: string
          guest_phone?: string | null
          id?: string
          plus_ones?: number
          profile_id?: string | null
          status: Database["public"]["Enums"]["rsvp_status"]
          waitlisted?: boolean
        }
        Update: {
          created_at?: string
          edit_token?: string
          event_id?: string
          guest_name?: string
          guest_phone?: string | null
          id?: string
          plus_ones?: number
          profile_id?: string | null
          status?: Database["public"]["Enums"]["rsvp_status"]
          waitlisted?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rsvps_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      table_bookings: {
        Row: {
          booker_name: string
          booker_phone: string | null
          created_at: string
          event_id: string
          id: string
          order_id: string
          table_id: string
        }
        Insert: {
          booker_name: string
          booker_phone?: string | null
          created_at?: string
          event_id: string
          id?: string
          order_id: string
          table_id: string
        }
        Update: {
          booker_name?: string
          booker_phone?: string | null
          created_at?: string
          event_id?: string
          id?: string
          order_id?: string
          table_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_bookings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_bookings_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: true
            referencedRelation: "venue_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_tiers: {
        Row: {
          currency: string
          description: string | null
          event_id: string
          id: string
          name: string
          per_order_limit: number
          position: number
          price_minor: number
          quantity: number
          sales_end: string | null
          sales_start: string | null
          sold: number
        }
        Insert: {
          currency: string
          description?: string | null
          event_id: string
          id?: string
          name: string
          per_order_limit?: number
          position?: number
          price_minor: number
          quantity: number
          sales_end?: string | null
          sales_start?: string | null
          sold?: number
        }
        Update: {
          currency?: string
          description?: string | null
          event_id?: string
          id?: string
          name?: string
          per_order_limit?: number
          position?: number
          price_minor?: number
          quantity?: number
          sales_end?: string | null
          sales_start?: string | null
          sold?: number
        }
        Relationships: [
          {
            foreignKeyName: "ticket_tiers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          attendee_name: string
          checked_in_at: string | null
          checked_in_by: string | null
          event_id: string
          id: string
          order_id: string
          qr_code: string
          status: Database["public"]["Enums"]["ticket_status"]
          tier_id: string
        }
        Insert: {
          attendee_name: string
          checked_in_at?: string | null
          checked_in_by?: string | null
          event_id: string
          id?: string
          order_id: string
          qr_code?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          tier_id: string
        }
        Update: {
          attendee_name?: string
          checked_in_at?: string | null
          checked_in_by?: string | null
          event_id?: string
          id?: string
          order_id?: string
          qr_code?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          tier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_checked_in_by_fkey"
            columns: ["checked_in_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "ticket_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_tables: {
        Row: {
          currency: string
          event_id: string
          held_for: string | null
          id: string
          name: string
          price_minor: number
          seats: number
          status: string
          venue_id: string | null
        }
        Insert: {
          currency: string
          event_id: string
          held_for?: string | null
          id?: string
          name: string
          price_minor: number
          seats: number
          status?: string
          venue_id?: string | null
        }
        Update: {
          currency?: string
          event_id?: string
          held_for?: string | null
          id?: string
          name?: string
          price_minor?: number
          seats?: number
          status?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venue_tables_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_tables_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          id: string
          venue_id: string
          profile_id: string
          party_size: number
          reserved_for: string
          note: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          venue_id: string
          profile_id: string
          party_size: number
          reserved_for: string
          note?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          venue_id?: string
          profile_id?: string
          party_size?: number
          reserved_for?: string
          note?: string | null
          status?: string
          created_at?: string
        }
        Relationships: []
      }
      app_events: {
        Row: {
          id: number
          profile_id: string | null
          name: string
          props: Record<string, unknown>
          platform: string | null
          created_at: string
        }
        Insert: {
          profile_id?: string | null
          name: string
          props?: Record<string, unknown>
          platform?: string | null
          created_at?: string
        }
        Update: {
          profile_id?: string | null
          name?: string
          props?: Record<string, unknown>
          platform?: string | null
          created_at?: string
        }
        Relationships: []
      }
      venue_claims: {
        Row: {
          id: string
          venue_id: string
          profile_id: string
          note: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          venue_id: string
          profile_id: string
          note?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          venue_id?: string
          profile_id?: string
          note?: string | null
          status?: string
          created_at?: string
        }
        Relationships: []
      }
      venue_photos: {
        Row: {
          created_at: string
          id: string
          position: number
          url: string
          venue_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          position?: number
          url: string
          venue_id: string
        }
        Update: {
          created_at?: string
          id?: string
          position?: number
          url?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_photos_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          address: string | null
          city: string | null
          country_code: string | null
          cover_url: string | null
          created_at: string
          cuisines: string[]
          description: string | null
          hours: string | null
          id: string
          kind: string
          lat: number | null
          lng: number | null
          logo_url: string | null
          menu_url: string | null
          name: string
          owner_id: string | null
          phone: string | null
          price_range: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country_code?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          menu_url?: string | null
          name: string
          owner_id?: string | null
          phone?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          menu_url?: string | null
          name?: string
          owner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venues_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activity_feed: {
        Args: Record<PropertyKey, never>
        Returns: {
          kind: string
          actor: string
          event_id: string
          event_slug: string
          event_title: string
          cover_url: string | null
          at: string
        }[]
      }
      city_feed: {
        Args: { p_city?: string }
        Returns: {
          id: string
          author_id: string
          author_name: string
          author_avatar: string | null
          body: string
          tag: string | null
          image_path: string | null
          event_id: string | null
          event_slug: string | null
          event_title: string | null
          like_count: number
          reply_count: number
          i_reacted: boolean
          created_at: string
        }[]
      }
      request_cohost: { Args: { p_event_id: string }; Returns: undefined }
      respond_cohost: {
        Args: { p_event_id: string; p_profile_id: string; p_accept: boolean }
        Returns: undefined
      }
      event_cohosts: {
        Args: { p_event_id: string }
        Returns: { profile_id: string; name: string; status: string }[]
      }
      event_guest_list_public: { Args: { e: string }; Returns: boolean }
      set_plus_ones: {
        Args: { p_rsvp_id: string; p_names: string[] }
        Returns: { id: string; name: string; invite_token: string; claimed: boolean }[]
      }
      host_guest_list: {
        Args: { p_event_id: string }
        Returns: {
          rsvp_id: string
          profile_id: string | null
          guest_name: string
          guest_phone: string | null
          status: string
          plus_ones: number
          avatar_url: string | null
          username: string | null
          created_at: string
          plus_one_names: string[]
        }[]
      }
      invite_past_guests: {
        Args: { p_source_event: string; p_target_event: string }
        Returns: { notified: number; skipped: number }
      }
      claim_plus_one: { Args: { p_token: string }; Returns: { slug: string; title: string } }
      venue_can_manage: { Args: { p_venue_id: string }; Returns: boolean }
      set_venue_logo: { Args: { p_id: string; p_logo_url: string }; Returns: undefined }
      set_venue_menu: { Args: { p_id: string; p_menu_url: string }; Returns: undefined }
      add_venue_photo: { Args: { p_venue_id: string; p_url: string }; Returns: string }
      remove_venue_photo: { Args: { p_photo_id: string }; Returns: undefined }
      host_update_event: {
        Args: {
          p_id: string
          p_title: string
          p_description: string
          p_venue_name: string
          p_venue_id: string | null
          p_address: string
          p_starts_at: string | null
          p_theme: string
          p_cover_url: string | null
          p_visibility: string
          p_allow_plus_ones: boolean
          p_playlist_url: string
        }
        Returns: undefined
      }
      admin_set_event_featured: { Args: { p_id: string; p_featured: boolean }; Returns: undefined }
      venue_directory: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          kind: string
          city: string | null
          description: string | null
          cover_url: string | null
          logo_url: string | null
          price_range: string | null
          cuisines: string[]
        }[]
      }
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
      admin_members: {
        Args: Record<PropertyKey, never>
        Returns: { id: string; name: string; city: string | null; suspended: boolean; created_at: string }[]
      }
      admin_recent_posts: {
        Args: Record<PropertyKey, never>
        Returns: { id: string; author_name: string; body: string; image_path: string | null; created_at: string }[]
      }
      admin_set_suspended: { Args: { p_id: string; p_suspended: boolean }; Returns: undefined }
      admin_delete_post: { Args: { p_id: string }; Returns: undefined }
      admin_create_venue: {
        Args: {
          p_name: string
          p_kind: string
          p_city: string
          p_address: string
          p_description: string
          p_phone: string
        }
        Returns: string
      }
      admin_set_venue_cover: {
        Args: { p_id: string; p_cover_url: string }
        Returns: undefined
      }
      admin_list_reservations: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          venue_id: string
          venue_name: string
          guest_name: string
          party_size: number
          reserved_for: string
          note: string | null
          status: string
          created_at: string
        }[]
      }
      admin_set_reservation_status: {
        Args: { p_id: string; p_status: string }
        Returns: undefined
      }
      my_owned_venue: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          kind: string
          city: string | null
          address: string | null
          description: string | null
          cover_url: string | null
          phone: string | null
          price_range: string | null
          cuisines: string[]
          hours: string | null
        }[]
      }
      request_venue_claim: {
        Args: { p_venue_id: string; p_note?: string }
        Returns: string
      }
      admin_list_claims: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          venue_id: string
          venue_name: string
          claimant: string
          note: string | null
          created_at: string
        }[]
      }
      admin_resolve_claim: {
        Args: { p_id: string; p_approve: boolean }
        Returns: undefined
      }
      set_venue_cover: {
        Args: { p_id: string; p_cover_url: string }
        Returns: undefined
      }
      owner_update_venue: {
        Args: {
          p_id: string
          p_description: string
          p_hours: string
          p_phone: string
          p_price_range: string
          p_cuisines: string[]
        }
        Returns: undefined
      }
      owner_list_reservations: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          venue_id: string
          venue_name: string
          guest_name: string
          party_size: number
          reserved_for: string
          note: string | null
          status: string
          created_at: string
        }[]
      }
      owner_set_reservation_status: {
        Args: { p_id: string; p_status: string }
        Returns: undefined
      }
      admin_list_promoter_payouts: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          promoter: string
          amount_minor: number
          currency: string
          destination: string
          status: string
          created_at: string
        }[]
      }
      admin_mark_promoter_payout: {
        Args: { p_id: string; p_status: string }
        Returns: undefined
      }
      admin_funnel: {
        Args: { p_days?: number }
        Returns: { name: string; events: number; users: number }[]
      }
      request_friend: { Args: { p_other: string }; Returns: string }
      respond_friend: { Args: { p_other: string; p_accept: boolean }; Returns: undefined }
      remove_friend: { Args: { p_other: string }; Returns: undefined }
      friend_status: { Args: { p_other: string }; Returns: string }
      my_friends: {
        Args: Record<PropertyKey, never>
        Returns: { id: string; name: string; avatar_url: string | null }[]
      }
      friend_requests: {
        Args: Record<PropertyKey, never>
        Returns: { id: string; name: string; avatar_url: string | null; created_at: string }[]
      }
      my_conversations: {
        Args: Record<PropertyKey, never>
        Returns: {
          other_id: string
          name: string
          avatar_url: string | null
          last_body: string
          last_at: string
          unread: number
        }[]
      }
      get_or_create_referral: {
        Args: { p_event_id: string }
        Returns: { code: string; commission_bps: number }[]
      }
      my_promotions: {
        Args: Record<PropertyKey, never>
        Returns: {
          event_id: string
          event_slug: string
          event_title: string
          code: string
          commission_bps: number
          tickets_sold: number
          earned_minor: number
          currency: string
        }[]
      }
      set_promoter_rate: {
        Args: { p_event_id: string; p_bps: number }
        Returns: undefined
      }
      promoter_balance: {
        Args: Record<PropertyKey, never>
        Returns: { available_minor: number; currency: string }[]
      }
      request_promoter_payout: {
        Args: { p_destination: string }
        Returns: { id: string; amount_minor: number; currency: string; status: string }[]
      }
      my_promoter_payouts: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          amount_minor: number
          currency: string
          destination: string
          status: string
          created_at: string
        }[]
      }
      event_promoter_leaderboard: {
        Args: { p_event_id: string }
        Returns: { promoter_name: string; tickets_sold: number; earned_minor: number }[]
      }
      feed_events: {
        Args: Record<PropertyKey, never>
        Returns: {
          address: string
          capacity: number
          cover_url: string
          currency: string
          ends_at: string
          featured: boolean
          going_count: number
          id: string
          is_ticketed: boolean
          sponsor_name: string | null
          slug: string
          starts_at: string
          timezone: string
          title: string
          trending_score: number
          venue_name: string
          reaction_count: number
          comment_count: number
          i_reacted: boolean
        }[]
      }
      is_event_manager: { Args: { e: string }; Returns: boolean }
      user_has_rsvp: { Args: { e: string }; Returns: boolean }
    }
    Enums: {
      event_status: "draft" | "published" | "cancelled"
      event_visibility: "public" | "unlisted" | "private"
      order_kind: "ticket" | "chip_in" | "table" | "merch"
      order_status: "pending" | "paid" | "failed" | "refunded" | "cancelled"
      question_type: "text" | "single_choice" | "multi_choice"
      rsvp_status: "going" | "maybe" | "declined"
      ticket_status: "valid" | "checked_in" | "void"
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
      event_status: ["draft", "published", "cancelled"],
      event_visibility: ["public", "unlisted", "private"],
      order_kind: ["ticket", "chip_in", "table", "merch"],
      order_status: ["pending", "paid", "failed", "refunded", "cancelled"],
      question_type: ["text", "single_choice", "multi_choice"],
      rsvp_status: ["going", "maybe", "declined"],
      ticket_status: ["valid", "checked_in", "void"],
    },
  },
} as const
