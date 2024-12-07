'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { type Profile, type Meme } from '@/lib/supabase'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ImagePost } from '@/components/image-post'
import { Loader2 } from 'lucide-react'

interface MemeWithStats extends Meme {
  likes_count: { count: number }
  comments_count: { count: number }
}

interface Post {
  id: number
  imageUrl: string
  author: {
    name: string
    avatar: string
  }
  likes: number
  comments: number
  createdAt: string
  prompt: string
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [memes, setMemes] = useState<MemeWithStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProfile() {
      if (!user) return

      try {
        // Load profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, created_at')
          .eq('id', user.id)
          .single()

        if (profileError) throw profileError
        setProfile(profileData)

        // Load memes with likes and comments count
        const { data: memesData, error: memesError } = await supabase
          .from('memes')
          .select(`
            *,
            likes_count:likes(count),
            comments_count:comments(count)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (memesError) throw memesError
        setMemes(memesData as MemeWithStats[])
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [user])

  if (!user) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <p className="text-muted-foreground">Please sign in to view your profile.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!profile) return null

  const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`

  return (
    <div className="container max-w-4xl py-8">
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.avatar_url || defaultAvatar} />
              <AvatarFallback>{profile.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{profile.username}</h1>
              <div className="mt-4 flex gap-6">
                <div>
                  <div className="text-2xl font-bold">{memes.length}</div>
                  <div className="text-sm text-muted-foreground">Memes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {memes.reduce((acc, meme) => acc + (meme.likes_count.count || 0), 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Likes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {memes.reduce((acc, meme) => acc + (meme.comments_count.count || 0), 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Comments</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="gallery">
        <TabsList className="w-full">
          <TabsTrigger value="gallery" className="flex-1">
            AI Gallery
          </TabsTrigger>
          <TabsTrigger value="liked" className="flex-1">
            Liked Memes
          </TabsTrigger>
        </TabsList>
        <TabsContent value="gallery" className="mt-6">
          <div className="space-y-8">
            {memes.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                No memes created yet. Time to get creative!
              </div>
            ) : (
              memes.map((meme) => (
                <ImagePost
                  key={meme.id}
                  post={{
                    id: parseInt(meme.id),
                    imageUrl: meme.image_url,
                    author: {
                      name: profile.username,
                      avatar: profile.avatar_url || defaultAvatar,
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
        </TabsContent>
        <TabsContent value="liked" className="mt-6">
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            Liked memes coming soon!
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 