'use client'

import { useEffect, useState } from 'react'
import { ImagePost } from '@/components/image-post'
import { ScrollArea } from '@/components/ui/scroll-area'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'
import type { Database } from '@/lib/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type Meme = Database['public']['Tables']['memes']['Row']

interface MemeWithAuthor extends Meme {
  profiles: Profile
  likes_count: Array<{ count: number }>
  comments_count: Array<{ count: number }>
}

export default function Home() {
  const [memes, setMemes] = useState<MemeWithAuthor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadMemes() {
      try {
        const { data, error } = await supabase
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
          .order('created_at', { ascending: false })

        if (error) throw error
        if (data) {
          setMemes(data as MemeWithAuthor[])
        }
      } catch (error) {
        console.error('Error loading memes:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMemes()

    // Subscribe to new memes and comments
    const channel = supabase
      .channel('public:memes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'memes',
        },
        async (payload) => {
          if (!payload.new || !('id' in payload.new)) return

          const { data, error } = await supabase
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
            .eq('id', payload.new.id)
            .single()

          if (error) {
            console.error('Error fetching new meme:', error)
            return
          }

          if (data) {
            setMemes((current) => [data as MemeWithAuthor, ...current])
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
        },
        async (payload) => {
          if (!payload.new || !('meme_id' in payload.new)) return

          const { data, error } = await supabase
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
            .eq('id', payload.new.meme_id)
            .single()

          if (error) {
            console.error('Error fetching updated meme:', error)
            return
          }

          if (data) {
            setMemes((current) =>
              current.map((meme) =>
                meme.id === data.id ? (data as MemeWithAuthor) : meme
              )
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container max-w-2xl py-4">
      <h1 className="mb-8 text-2xl font-bold">AI Meme Feed</h1>
      <ScrollArea className="h-[calc(100vh-8rem)]">
        <div className="space-y-8">
          {memes.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              No memes yet. Be the first to create one!
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
