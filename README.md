📚 CourseAI – One Prompt to Learn Anything
CourseAI is an AI-powered course generator that turns a single prompt into a complete educational course — complete with real YouTube video integration. No login required.

🚧 Note: The platform is under active development. Sign-in and sign-up features are being added, but there are deployment issues due to limited API credits. For now, we recommend running it locally for the best experience.

🚀 Features
✨ Generate entire educational courses from a single prompt using Gemini AI

🎥 Curated YouTube videos integrated for each topic via YouTube Data API

💬 Built-in comment system powered by Supabase

🌗 Beautiful UI with Light/Dark Mode support

⚡ Instant access with Vercel deployment-ready configuration

🔧 Tech Stack
Frontend: React + TypeScript + Vite

Styling: Tailwind CSS

AI Integration: Gemini AI API (Google DeepMind)

Video Integration: YouTube Data API

Backend & Comments: Supabase (no auth currently)

Deployment: Vercel

⚙️ Getting Started (Local Development)
1. Clone the Repository
bash
Copy
Edit
git clone https://github.com/poshithNandyala/CourseAI.git
cd CourseAI
2. Install Dependencies
bash
Copy
Edit
npm install
3. Setup Environment Variables
Copy the example env file and add your API keys:

bash
Copy
Edit
cp .env.example .env
Then fill in the values:

env
Copy
Edit
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# YouTube API Configuration
VITE_YOUTUBE_API_KEY=your_youtube_api_key

# Gemini AI API Configuration
VITE_GEMINI_API_KEY=your_gemini_api_key
4. Run the App Locally
bash
Copy
Edit
npm run dev
Open your browser and visit: http://localhost:5173

🌐 Deployment on Vercel
CourseAI is ready for deployment on Vercel.

1. Add Environment Variables
In your Vercel dashboard, go to:

mathematica
Copy
Edit
Project → Settings → Environment Variables
Add the following:

nginx
Copy
Edit
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_YOUTUBE_API_KEY
VITE_GEMINI_API_KEY
2. Enable SPA Routing
Create a vercel.json file in the root directory:

json
Copy
Edit
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
3. Push & Deploy
bash
Copy
Edit
git add .
git commit -m "Add Vercel config and env setup"
git push
Vercel will auto-deploy your project on every push.

📁 Project Structure
graphql
Copy
Edit
.
├── src/
│   ├── components/        # Reusable UI components
│   ├── pages/             # Home and Course detail views
│   ├── services/          # API functions (YouTube, Gemini, Supabase)
│   └── App.tsx            # Main App structure
├── public/
│   └── _redirects         # Netlify SPA routing fallback
├── vercel.json            # Vercel SPA routing config
└── .env.example           # Example env variables
📝 Notes & Recommendations
⚠️ API Limits: The YouTube Data API and Gemini AI API have usage quotas. If you exceed them, some features may not work.

🔐 Authentication: Sign-in/Sign-up functionality is under development. Expect breaking changes during future updates.

🧪 Development Tip: For now, run locally for best results and to avoid quota limitations.

🙏 Credits
🤖 Course generation powered by Gemini AI (Google DeepMind)

📺 Video content fetched using the YouTube Data API

🔧 Backend and comment system via Supabase

⚡ Prompt and architecture powered by Bolt AI

📣 Contributing
Feel free to open issues or submit PRs! This project is a work in progress and contributions are welcome.
