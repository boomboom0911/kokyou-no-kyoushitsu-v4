export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      students: {
        Row: {
          id: number
          google_email: string
          class_id: number | null
          student_number: string
          display_name: string
          created_at: string
        }
        Insert: {
          id?: number
          google_email: string
          class_id?: number | null
          student_number: string
          display_name: string
          created_at?: string
        }
        Update: {
          id?: number
          google_email?: string
          class_id?: number | null
          student_number?: string
          display_name?: string
          created_at?: string
        }
      }
      classes: {
        Row: {
          id: number
          name: string
          grade: number | null
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          grade?: number | null
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          grade?: number | null
          created_at?: string
        }
      }
      lesson_sessions: {
        Row: {
          id: number
          code: string
          class_id: number | null
          topic_title: string
          topic_content: string | null
          date: string
          period: number
          is_active: boolean
          started_at: string
          ended_at: string | null
          created_at: string
        }
        Insert: {
          id?: number
          code: string
          class_id?: number | null
          topic_title: string
          topic_content?: string | null
          date: string
          period: number
          is_active?: boolean
          started_at?: string
          ended_at?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          code?: string
          class_id?: number | null
          topic_title?: string
          topic_content?: string | null
          date?: string
          period?: number
          is_active?: boolean
          started_at?: string
          ended_at?: string | null
          created_at?: string
        }
      }
      seat_assignments: {
        Row: {
          id: number
          session_id: number
          student_id: number
          seat_number: number
          created_at: string
        }
        Insert: {
          id?: number
          session_id: number
          student_id: number
          seat_number: number
          created_at?: string
        }
        Update: {
          id?: number
          session_id?: number
          student_id?: number
          seat_number?: number
          created_at?: string
        }
      }
      topic_posts: {
        Row: {
          id: number
          session_id: number
          student_id: number
          seat_assignment_id: number
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          session_id: number
          student_id: number
          seat_assignment_id: number
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          session_id?: number
          student_id?: number
          seat_assignment_id?: number
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: number
          session_id: number
          student_id: number | null
          message: string
          created_at: string
        }
        Insert: {
          id?: number
          session_id: number
          student_id?: number | null
          message: string
          created_at?: string
        }
        Update: {
          id?: number
          session_id?: number
          student_id?: number | null
          message?: string
          created_at?: string
        }
      }
      reactions: {
        Row: {
          id: number
          target_type: string
          target_id: number
          student_id: number
          reaction_type: string
          created_at: string
        }
        Insert: {
          id?: number
          target_type: string
          target_id: number
          student_id: number
          reaction_type: string
          created_at?: string
        }
        Update: {
          id?: number
          target_type?: string
          target_id?: number
          student_id?: number
          reaction_type?: string
          created_at?: string
        }
      }
      interactions: {
        Row: {
          id: number
          target_type: string
          target_id: number
          student_id: number
          type: string
          comment_text: string
          created_at: string
        }
        Insert: {
          id?: number
          target_type: string
          target_id: number
          student_id: number
          type?: string
          comment_text: string
          created_at?: string
        }
        Update: {
          id?: number
          target_type?: string
          target_id?: number
          student_id?: number
          type?: string
          comment_text?: string
          created_at?: string
        }
      }
      learning_memos: {
        Row: {
          id: string
          student_id: number
          session_id: number | null
          content: string
          tags: string[]
          is_favorite: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: number
          session_id?: number | null
          content: string
          tags?: string[]
          is_favorite?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: number
          session_id?: number | null
          content?: string
          tags?: string[]
          is_favorite?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      export_history: {
        Row: {
          id: string
          student_id: number | null
          export_type: string
          file_format: string
          exported_at: string
        }
        Insert: {
          id?: string
          student_id?: number | null
          export_type: string
          file_format: string
          exported_at?: string
        }
        Update: {
          id?: string
          student_id?: number | null
          export_type?: string
          file_format?: string
          exported_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
