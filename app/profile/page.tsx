'use client'

import { useEffect, useState } from 'react'
import { ImagePost } from '@/components/image-post'
import { ScrollArea } from '@/components/ui/scroll-area'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import { Loader2 } from 'lucide-react'
import type { Database } from '@/lib/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type Meme = Database['public']['Tables']['memes']['Row']

interface MemeWithAuthor extends Meme {
  profiles: Profile;
  likes_count: Array<{ count: number }>;
  comments_count: Array<{ count: number }>;
}

export default function ProfilePage() {
  const [memes, setMemes] = useState<MemeWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    async function loadMemes() {
      if (!user) return

      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) throw profileError

        const { data: memesData, error: memesError } = await supabase
          .from('memes')
          .select(`
            *,
            profiles!memes_user_id_fkey (
              id,
              username,
              avatar_url,
              created_at
            ),
            likes_count:likes(count),
            comments_count:comments(count)
          `)
          .returns<MemeWithAuthor[]>();

        if (memesError) throw memesError
        setMemes(memesData || []);
      } catch (error) {
        console.error('Error loading profile memes:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMemes()
  }, [user])

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container max-w-2xl py-4">
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Please sign in to view your profile
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl py-4">
      <h1 className="mb-8 text-2xl font-bold">My Memes</h1>
      <ScrollArea className="h-[calc(100vh-8rem)]">
        <div className="space-y-8">
          {memes.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              You haven&apos;t created any memes yet
            </div>
          ) : (
            memes.map((meme) => (
              <ImagePost
                key={meme.id}
                post={{
                  id: meme.id,
                  imageUrl: meme.image_url,
                  author: {
                    name: meme.profiles.username,
                    avatar: meme.profiles.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${meme.profiles.username}`,
                  },
                  likes: meme.likes_count[0]?.count || 0,
                  comments: meme.comments_count[0]?.count || 0,
                  createdAt: new Date(meme.created_at).toLocaleDateString(),
                  prompt: meme.caption || '',
                }}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
} 