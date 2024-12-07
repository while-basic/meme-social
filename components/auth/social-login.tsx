'use client'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { Github } from 'lucide-react'
import Image from 'next/image'

export function SocialLogin() {
  const { signInWithProvider } = useAuth()

  return (
    <div className="grid gap-2">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          onClick={() => signInWithProvider('google')}
          className="w-full"
        >
          <Image
            src="/google.svg"
            alt="Google"
            width={16}
            height={16}
            className="mr-2"
          />
          Google
        </Button>
        <Button
          variant="outline"
          onClick={() => signInWithProvider('github')}
          className="w-full"
        >
          <Github className="mr-2 h-4 w-4" />
          GitHub
        </Button>
      </div>
    </div>
  )
} 