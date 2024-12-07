'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Wand2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

const styles = [
  { value: 'modern', label: 'Modern' },
  { value: 'pixel', label: 'Pixel Art' },
  { value: 'cartoon', label: 'Cartoon' },
  { value: 'realistic', label: 'Realistic' },
  { value: 'anime', label: 'Anime' },
  { value: 'cyberpunk', label: 'Cyberpunk' },
  { value: 'vaporwave', label: 'Vaporwave' },
  { value: 'renaissance', label: 'Renaissance' },
]

export default function CreatePost() {
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState<string>('')
  const [generating, setGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const handleGenerate = async () => {
    if (!prompt) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a prompt to generate an image.',
      })
      return
    }

    try {
      setGenerating(true)
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, style }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate image')
      }

      const data = await response.json()
      setGeneratedImage(data.imageUrl)
      
      toast({
        title: 'Success!',
        description: 'Your meme has been generated and shared.',
      })

      // Redirect to home page after a short delay
      setTimeout(() => {
        router.push('/')
        router.refresh()
      }, 2000)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate image',
      })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="container max-w-2xl py-4">
      <h1 className="mb-8 text-2xl font-bold">Create New Meme</h1>
      
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <Textarea
              placeholder="Describe your meme idea... (e.g., 'A cyberpunk cat wearing VR headset in neon city')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Style</label>
                <Select
                  value={style}
                  onValueChange={setStyle}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    {styles.map((style) => (
                      <SelectItem key={style.value} value={style.value}>
                        {style.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          className="w-full"
          size="lg"
          onClick={handleGenerate}
          disabled={!prompt || generating}
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              Generate Meme
            </>
          )}
        </Button>

        {/* Preview area */}
        <Card className="overflow-hidden">
          <CardContent className="aspect-square p-0">
            {generatedImage ? (
              <Image
                src={generatedImage}
                alt="Generated meme"
                width={1024}
                height={1024}
                className="h-full w-full object-cover"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Generated image will appear here
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 