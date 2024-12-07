import { ImagePost } from '@/components/image-post'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function Home() {
  // Placeholder data for posts
  const posts = [
    {
      id: 1,
      imageUrl: 'https://source.unsplash.com/random/400x400?1',
      author: {
        name: 'John Doe',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
      },
      likes: 42,
      comments: 12,
      createdAt: '2h ago',
      prompt: 'A surreal landscape with floating islands and purple skies',
    },
    {
      id: 2,
      imageUrl: 'https://source.unsplash.com/random/400x400?2',
      author: {
        name: 'Jane Smith',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',
      },
      likes: 128,
      comments: 24,
      createdAt: '4h ago',
      prompt: 'Cyberpunk cat wearing VR headset in neon city',
    },
    // Add more placeholder posts as needed
  ]

  return (
    <div className="container max-w-2xl py-4">
      <h1 className="mb-8 text-2xl font-bold">AI Meme Feed</h1>
      <ScrollArea className="h-[calc(100vh-8rem)]">
        <div className="space-y-8">
          {posts.map((post) => (
            <ImagePost key={post.id} post={post} />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
