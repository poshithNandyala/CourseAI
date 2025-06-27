📚 CourseAI — One Prompt to Learn Anything
CourseAI is an AI-powered course generator that transforms a single prompt into a full-fledged educational experience — complete with curated YouTube videos, interactive comments, and sleek UI.

🚧 Under active development: For best results, run locally to avoid API quota issues.

🚀 Features
✨ Generate complete educational courses using a single prompt via Gemini AI

🎥 Curated YouTube video content for each topic using the YouTube Data API

💬 Built-in commenting system powered by Supabase

🌗 Beautiful UI with Dark/Light Mode

⚡ Instant deployment-ready (Vercel config included)

🔧 Tech Stack
Layer	Tech
Frontend	React + TypeScript + Vite
Styling	Tailwind CSS
AI API	Gemini (Google DeepMind)
Video API	YouTube Data API
Backend	Supabase (no auth yet)
Hosting	Vercel

⚙️ Getting Started – Local Development
1️⃣ Clone the Repo
bash
Copy
Edit
git clone https://github.com/poshithNandyala/CourseAI.git
cd CourseAI
2️⃣ Install Dependencies
bash
Copy
Edit
npm install
3️⃣ Setup Environment Variables
bash
Copy
Edit
cp .env.example .env
Then fill in your credentials in .env:

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
4️⃣ Run the App
bash
Copy
Edit
npm run dev
Open your browser: 👉 http://localhost:5173

🌐 Vercel Deployment
🔑 Add Environment Variables
In Vercel Dashboard:
Project → Settings → Environment Variables

Add:

env
Copy
Edit
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_YOUTUBE_API_KEY
VITE_GEMINI_API_KEY
🔁 Enable SPA Routing
Create vercel.json in the root:

json
Copy
Edit
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
🚀 Push to Deploy
bash
Copy
Edit
git add .
git commit -m "Add Vercel config and env setup"
git push
Vercel will auto-deploy your app 🎉

📁 Project Structure
bash
Copy
Edit
.
├── src/
│   ├── components/        # UI components
│   ├── pages/             # Views (Home, Course)
│   ├── services/          # API integrations (YouTube, Gemini, Supabase)
│   └── App.tsx            # Main app structure
├── public/
│   └── _redirects         # SPA fallback for Netlify
├── vercel.json            # Vercel routing config
└── .env.example           # Example env file
📝 Notes & Recommendations
⚠️ API Quotas: YouTube and Gemini APIs have rate limits — expect failures if exceeded.

🔐 Auth: Sign-in/Sign-up features coming soon.

🧪 Best Tip: Use local development for smooth experience (no API quota throttling).

🙏 Credits
🤖 Course generation: Gemini AI (Google DeepMind)

📺 Video curation: YouTube Data API

💬 Comments backend: Supabase

⚡ Architecture: Bolt AI

💡 Contributing
We welcome contributions!
🛠 Feel free to open issues or submit pull requests.
This project is in active development — your ideas matter!

