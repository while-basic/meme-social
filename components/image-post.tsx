'use client'

import Image from 'next/image'
import { Heart, MessageCircle, Share2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import type { PostgrestError } from '@supabase/supabase-js'

interface Comment {
  id: string
  content: string
  created_at: string
  profiles: {
    username: string
    avatar_url: string | null
  }
}

interface Post {
  id: string
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

export function ImagePost({ post }: { post: Post }) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likes)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const loadComments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          profiles (
            username,
            avatar_url
          )
        `)
        .eq('meme_id', post.id)
        .order('created_at', { ascending: true })

      if (error) {
        throw error
      }

      if (data) {
        setComments(data)
      }
    } catch (error) {
      const pgError = error as PostgrestError
      console.error('Error loading comments:', pgError.message)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load comments',
      })
    }
  }, [post.id, toast])

  useEffect(() => {
    if (showComments) {
      loadComments()
    }
  }, [showComments, loadComments])

  const handleLike = () => {
    if (liked) {
      setLikeCount(likeCount - 1)
    } else {
      setLikeCount(likeCount + 1)
    }
    setLiked(!liked)
  }

  const handleComment = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }

    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please sign in to comment',
      })
      return
    }

    const commentText = newComment.trim()
    if (!commentText) return

    setLoading(true)
    try {
      const { data: comment, error: commentError } = await supabase
        .from('comments')
        .insert({
          meme_id: post.id,
          user_id: user.id,
          content: commentText,
        })
        .select(`
          id,
          content,
          created_at,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .single()

      if (commentError) {
        console.error('Error inserting comment:', commentError)
        throw commentError
      }

      if (comment) {
        setComments((prevComments) => [...prevComments, comment])
        setNewComment('')
        toast({
          title: 'Success',
          description: 'Comment added successfully',
        })
      }
    } catch (error) {
      const pgError = error as PostgrestError
      console.error('Error adding comment:', pgError.message)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to add comment: ${pgError.message}`,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-4 space-y-0">
        <Avatar>
          <AvatarImage src={post.author.avatar} alt={post.author.name} />
          <AvatarFallback>{post.author.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <p className="font-semibold">{post.author.name}</p>
          <p className="text-sm text-muted-foreground">{post.createdAt}</p>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative aspect-square">
          <Image
            src={post.imageUrl}
            alt="AI generated image"
            fill
            className="object-cover"
          />
        </div>
        <div className="space-y-2 p-6">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold">Prompt:</span> {post.prompt}
          </p>
          {showComments && (
            <div className="mt-4 space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={comment.profiles.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.profiles.username}`}
                      alt={comment.profiles.username}
                    />
                    <AvatarFallback>
                      {comment.profiles.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold">
                        {comment.profiles.username}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <div className="flex w-full justify-between">
          <div className="flex gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="flex gap-1"
              onClick={handleLike}
            >
              <Heart
                className={liked ? 'fill-red-500 stroke-red-500' : ''}
                size={20}
              />
              <span>{likeCount}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex gap-1"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle size={20} />
              <span>{comments.length || post.comments}</span>
            </Button>
          </div>
          <Button variant="ghost" size="sm">
            <Share2 size={20} />
          </Button>
        </div>
        {showComments && (
          <form onSubmit={handleComment} className="flex w-full gap-2">
            <Input
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={loading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={loading || !newComment.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        )}
      </CardFooter>
    </Card>
  )
} 