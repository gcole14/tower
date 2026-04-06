export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          twilio_account_sid: string | null
          twilio_auth_token: string | null
          twilio_phone_number: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          twilio_account_sid?: string | null
          twilio_auth_token?: string | null
          twilio_phone_number?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          twilio_account_sid?: string | null
          twilio_auth_token?: string | null
          twilio_phone_number?: string | null
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          org_id: string
          display_name: string
          role: string
          created_at: string
        }
        Insert: {
          id: string
          org_id: string
          display_name: string
          role: string
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          display_name?: string
          role?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      invites: {
        Row: {
          id: string
          org_id: string
          email: string
          role: string
          token: string
          accepted_at: string | null
          invited_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          email: string
          role: string
          token?: string
          accepted_at?: string | null
          invited_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          email?: string
          role?: string
          token?: string
          accepted_at?: string | null
          invited_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      members: {
        Row: {
          id: string
          org_id: string
          name: string
          phone: string
          group_tag: 'elders_quorum' | 'relief_society' | null
          opted_out: boolean
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          phone: string
          group_tag?: 'elders_quorum' | 'relief_society' | null
          opted_out?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          phone?: string
          group_tag?: 'elders_quorum' | 'relief_society' | null
          opted_out?: boolean
          created_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          org_id: string
          sent_by: string
          body: string
          scope: 'ward' | 'elders_quorum' | 'relief_society' | 'stake_all'
          recipient_count: number
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          sent_by: string
          body: string
          scope: 'ward' | 'elders_quorum' | 'relief_society' | 'stake_all'
          recipient_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          sent_by?: string
          body?: string
          scope?: 'ward' | 'elders_quorum' | 'relief_society' | 'stake_all'
          recipient_count?: number
          created_at?: string
        }
        Relationships: []
      }
      message_log: {
        Row: {
          id: string
          message_id: string
          member_id: string
          phone: string
          status: string
          twilio_sid: string | null
          created_at: string
        }
        Insert: {
          id?: string
          message_id: string
          member_id: string
          phone: string
          status: string
          twilio_sid?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          member_id?: string
          phone?: string
          status?: string
          twilio_sid?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      get_my_org_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_my_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
