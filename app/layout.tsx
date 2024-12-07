import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { NavBar } from '@/components/nav-bar'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'AI Meme Social',
  description: 'Share and discover AI-generated memes',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="relative min-h-screen bg-background">
            <NavBar />
            <main className="flex flex-col min-h-[calc(100vh-3.5rem)]">
              {children}
            </main>
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
