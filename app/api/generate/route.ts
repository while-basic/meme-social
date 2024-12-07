import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const runtime = 'edge'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { prompt, style } = await request.json()

    if (!prompt) {
      return new NextResponse('Prompt is required', { status: 400 })
    }

    // Generate image with DALL-E 3
    const response = await openai.images.generate({
      model: "dall-e-3", // dall-e-3 is not available in the free tier
      prompt: `${prompt}${style ? `. Style: ${style}` : ''}`,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "vivid",
    })

    const imageUrl = response.data[0].url

    if (!imageUrl) {
      throw new Error('Failed to generate image')
    }

    // Save the meme to Supabase
    const { data: meme, error: memeError } = await supabase
      .from('memes')
      .insert([
        {
          user_id: session.user.id,
          image_url: imageUrl,
          caption: prompt,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (memeError) {
      throw memeError
    }

    return NextResponse.json({ imageUrl, meme })
  } catch (error) {
    console.error('[DALLE ERROR]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 