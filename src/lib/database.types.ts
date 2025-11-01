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
      boards: {
        Row: {
          id: string
          code: string
          title: string
          description: string | null
          min_reviews_required: number
          min_reviews_to_give: number
          submission_deadline: string | null
          review_deadline: string | null
          target_students: string[] | null
          is_public: boolean
          status: string
          allow_edit_after_review: boolean
          show_author_names: boolean
          created_by: number | null
          created_at: string
          updated_at: string
          settings: Json | null
        }
        Insert: {
          id?: string
          code: string
          title: string
          description?: string | null
          min_reviews_required?: number
          min_reviews_to_give?: number
          submission_deadline?: string | null
          review_deadline?: string | null
          target_students?: string[] | null
          is_public?: boolean
          status?: string
          allow_edit_after_review?: boolean
          show_author_names?: boolean
          created_by?: number | null
          created_at?: string
          updated_at?: string
          settings?: Json | null
        }
        Update: {
          id?: string
          code?: string
          title?: string
          description?: string | null
          min_reviews_required?: number
          min_reviews_to_give?: number
          submission_deadline?: string | null
          review_deadline?: string | null
          target_students?: string[] | null
          is_public?: boolean
          status?: string
          allow_edit_after_review?: boolean
          show_author_names?: boolean
          created_by?: number | null
          created_at?: string
          updated_at?: string
          settings?: Json | null
        }
      }
      board_submissions: {
        Row: {
          id: string
          board_id: string
          student_id: number
          title: string
          description: string | null
          work_url: string
          work_type: string
          view_count: number
          review_count: number
          is_edited: boolean
          edit_count: number
          last_edited_at: string | null
          visibility: string
          is_featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          board_id: string
          student_id: number
          title: string
          description?: string | null
          work_url: string
          work_type: string
          view_count?: number
          review_count?: number
          is_edited?: boolean
          edit_count?: number
          last_edited_at?: string | null
          visibility?: string
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          board_id?: string
          student_id?: number
          title?: string
          description?: string | null
          work_url?: string
          work_type?: string
          view_count?: number
          review_count?: number
          is_edited?: boolean
          edit_count?: number
          last_edited_at?: string | null
          visibility?: string
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      peer_reviews: {
        Row: {
          id: string
          submission_id: string
          reviewer_id: number
          strengths: string[]
          suggestions: string[]
          questions: string[]
          overall_comment: string | null
          character_count: number
          helpful_count: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          submission_id: string
          reviewer_id: number
          strengths?: string[]
          suggestions?: string[]
          questions?: string[]
          overall_comment?: string | null
          character_count?: number
          helpful_count?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          submission_id?: string
          reviewer_id?: number
          strengths?: string[]
          suggestions?: string[]
          questions?: string[]
          overall_comment?: string | null
          character_count?: number
          helpful_count?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      reviewer_profiles: {
        Row: {
          id: string
          student_id: number
          board_id: string
          animal_type: string
          level: number
          review_count: number
          helpful_total: number
          total_characters: number
          decorations: string[]
          badges: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: number
          board_id: string
          animal_type: string
          level?: number
          review_count?: number
          helpful_total?: number
          total_characters?: number
          decorations?: string[]
          badges?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: number
          board_id?: string
          animal_type?: string
          level?: number
          review_count?: number
          helpful_total?: number
          total_characters?: number
          decorations?: string[]
          badges?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      submission_with_stats: {
        Row: {
          id: string
          board_id: string
          student_id: number
          title: string
          description: string | null
          work_url: string
          work_type: string
          view_count: number
          review_count: number
          is_edited: boolean
          edit_count: number
          last_edited_at: string | null
          visibility: string
          is_featured: boolean
          created_at: string
          updated_at: string
          class_id: number | null
          student_number: string
          student_name: string
          review_count_actual: number
          total_helpful: number
          reviews_given_count: number
        }
        Insert: never
        Update: never
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
