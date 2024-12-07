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

interface CommentResponse {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

export function ImagePost({ post }: { post: Post }) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(Math.max(0, post.likes))
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentCount, setCommentCount] = useState(post.comments)
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
        const formattedComments = data.map(comment => ({
          ...comment,
          profiles: {
            username: comment.profiles?.username ?? 'Anonymous',
            avatar_url: comment.profiles?.avatar_url ?? null
          }
        }))
        setComments(formattedComments)
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

  // Load initial like count and check if user has liked
  useEffect(() => {
    async function loadLikeStatus() {
      try {
        // Get total likes count
        const { count: totalLikes, error: countError } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('meme_id', post.id)

        if (countError) throw countError

        if (totalLikes !== null) {
          setLikeCount(Math.max(0, totalLikes))
        }

        // Check if current user has liked
        if (user) {
          const { data, error } = await supabase
            .from('likes')
            .select('id')
            .eq('meme_id', post.id)
            .eq('user_id', user.id)
            .single()

          if (error && error.code !== 'PGRST116') {
            throw error
          }

          setLiked(!!data)
        }
      } catch (error) {
        console.error('Error loading like status:', error)
      }
    }

    loadLikeStatus()
  }, [post.id, user])

  // Subscribe to like changes
  useEffect(() => {
    const channel = supabase
      .channel(`meme-${post.id}-likes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'likes',
          filter: `meme_id=eq.${post.id}`,
        },
        async () => {
          // Update like count
          const { count } = await supabase
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('meme_id', post.id)

          if (count !== null) {
            setLikeCount(Math.max(0, count))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [post.id])

  // Subscribe to comment changes
  useEffect(() => {
    const channel = supabase
      .channel(`meme-${post.id}-comments`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `meme_id=eq.${post.id}`,
        },
        async () => {
          // Update comment count
          const { count } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('meme_id', post.id)

          if (count !== null) {
            setCommentCount(count)
          }

          // If comments are shown, reload them
          if (showComments) {
            await loadComments()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [post.id, showComments, loadComments])

  // Load initial comment count
  useEffect(() => {
    async function loadCommentCount() {
      try {
        const { count, error } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('meme_id', post.id)

        if (error) throw error

        if (count !== null) {
          setCommentCount(count)
        }
      } catch (error) {
        console.error('Error loading comment count:', error)
      }
    }

    loadCommentCount()
  }, [post.id])

  useEffect(() => {
    if (showComments) {
      loadComments()
    }
  }, [showComments, loadComments])

  const handleLike = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please sign in to like posts',
      })
      return
    }

    try {
      if (liked) {
        // Remove like
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('meme_id', post.id)
          .eq('user_id', user.id)

        if (error) throw error

        setLiked(false)
        setLikeCount((prev) => Math.max(0, prev - 1))
      } else {
        // Add like
        const { error } = await supabase
          .from('likes')
          .insert({
            meme_id: post.id,
            user_id: user.id,
          })

        if (error) throw error

        setLiked(true)
        setLikeCount((prev) => prev + 1)
      }
    } catch (error) {
      console.error('Error updating like:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update like',
      })
    }
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
      const { data: commentData, error: commentError } = await supabase
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
          profiles:profiles!user_id (
            username,
            avatar_url
          )
        `)
        .single<CommentResponse>()

      if (commentError) throw commentError

      if (commentData) {
        const formattedComment: Comment = {
          id: commentData.id,
          content: commentData.content,
          created_at: commentData.created_at,
          profiles: {
            username: commentData.profiles.username ?? 'Anonymous',
            avatar_url: commentData.profiles.avatar_url ?? null
          }
        }
        
        setComments(prevComments => [...prevComments, formattedComment])
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
              <span>{commentCount}</span>
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