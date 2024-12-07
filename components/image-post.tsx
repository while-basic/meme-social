'use client'

import Image from 'next/image'
import { Heart, MessageCircle, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card'
import { useState } from 'react'

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

export function ImagePost({ post }: { post: Post }) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likes)

  const handleLike = () => {
    if (liked) {
      setLikeCount(likeCount - 1)
    } else {
      setLikeCount(likeCount + 1)
    }
    setLiked(!liked)
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
        <p className="p-6 text-sm text-muted-foreground">
          <span className="font-semibold">Prompt:</span> {post.prompt}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between">
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
          <Button variant="ghost" size="sm" className="flex gap-1">
            <MessageCircle size={20} />
            <span>{post.comments}</span>
          </Button>
        </div>
        <Button variant="ghost" size="sm">
          <Share2 size={20} />
        </Button>
      </CardFooter>
    </Card>
  )
} 