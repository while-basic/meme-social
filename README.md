# AI Meme Social

A social network for creating and sharing AI-generated memes using DALL-E 3.

## Features

- 🎨 AI-powered meme generation with DALL-E 3
- 🔒 Secure authentication with Supabase
- 🌙 Dark mode support
- 📱 Mobile-first responsive design
- 🖼️ Multiple art styles
- ❤️ Like and comment system
- 👤 User profiles

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase (Auth & Database)
- OpenAI API (DALL-E 3)

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/meme-social.git
   cd meme-social
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Create a `.env.local` file with your environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENAI_API_KEY=your_openai_api_key
   ```

4. Run the development server:
   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

### Profiles
- id (string, primary key)
- username (string)
- avatar_url (string, nullable)
- created_at (timestamp)

### Memes
- id (string, primary key)
- user_id (string, foreign key)
- image_url (string)
- caption (string, nullable)
- created_at (timestamp)

### Likes
- id (string, primary key)
- user_id (string, foreign key)
- meme_id (string, foreign key)
- created_at (timestamp)

### Comments
- id (string, primary key)
- user_id (string, foreign key)
- meme_id (string, foreign key)
- content (string)
- created_at (timestamp)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
