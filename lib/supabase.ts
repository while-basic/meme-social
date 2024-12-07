import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from './database.types'

export const supabase = createClientComponentClient<Database>()

export type Profile = Database['public']['Tables']['profiles']['Row']

export type Meme = {
  id: string
  user_id: string
  image_url: string
  caption: string | null
  created_at: string
  profiles?: Profile
  likes?: number
  user_has_liked?: boolean
  comments?: number
}

export type Comment = {
  id: string
  user_id: string
  meme_id: string
  content: string
  created_at: string
  profiles?: Profile
} 