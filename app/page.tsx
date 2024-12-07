'use client'

import { useEffect, useState } from 'react'
import { ImagePost } from '@/components/image-post'
import { ScrollArea } from '@/components/ui/scroll-area'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'
import type { Database } from '@/lib/database.types'

type MemeWithAuthor = Database['public']['Tables']['memes']['Row'] & {
  profiles: Database['public']['Tables']['profiles']['Row']
  likes_count: { count: number }
  comments_count: { count: number }
}

export default function Home() {
  const [memes, setMemes] = useState<MemeWithAuthor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadMemes() {
      try {
        const { data: memesData, error } = await supabase
          .from('memes')
          .select(`
            *,
            profiles:user_id (*),
            likes_count:likes(count),
            comments_count:comments(count)
          `)
          .order('created_at', { ascending: false })

        if (error) throw error
        setMemes(memesData)
      } catch (error) {
        console.error('Error loading memes:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMemes()

    // Subscribe to new memes
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
          // Fetch the complete meme data with author and counts
          const { data: newMeme } = await supabase
            .from('memes')
            .select(`
              *,
              profiles:user_id (*),
              likes_count:likes(count),
              comments_count:comments(count)
            `)
            .eq('id', payload.new.id)
            .single()

          if (newMeme) {
            setMemes((currentMemes) => [newMeme, ...currentMemes])
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
                  likes: meme.likes_count.count || 0,
                  comments: meme.comments_count.count || 0,
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
