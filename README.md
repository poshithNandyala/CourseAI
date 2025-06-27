# 📚 CourseAI — One Prompt to Learn Anything

**CourseAI** is an AI-powered course generator that transforms a single prompt into a full-fledged educational experience — complete with curated YouTube videos, interactive comments, and a sleek, responsive user interface.

> 🧑‍💻 This is a **side hustle project** developed during my spare hours — built on top of **Bolt AI**, with custom enhancements and features. Huge thanks to Bolt AI for the **free subscription** ❤️.

-----

## 🚧 Under Active Development

For the best results, it's recommended to run the application locally due to API quota limitations. Some features like authentication were built but are temporarily disabled due to deployment issues and my current busy personal schedule.

-----

## 🚀 Features

  - ✨ **Generate Complete Educational Courses**: Gemini AI creates topic-rich course outlines from a single user prompt.
  - 🎥 **Curated YouTube Videos**: Pulls relevant educational videos per topic via the YouTube Data API.
  - 💬 **Built-in Commenting System**: Powered by Supabase to encourage user interaction and discussion.
  - 🌗 **Dark/Light Mode**: Customizable and accessible modern UI.
  - ⚡ **Vercel Deployment Ready**: Configured for fast and easy deployment.

-----

## 🔧 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React + TypeScript + Vite |
| **Styling** | Tailwind CSS |
| **AI API** | Gemini (Google DeepMind) |
| **Video API** | YouTube Data API |
| **Backend** | Supabase (auth temporarily removed) |
| **Hosting** | Vercel |

-----

## ⚙️ Getting Started – Local Development

### 1️⃣ Clone the Repo

```bash
git clone https://github.com/poshithNandyala/CourseAI.git
cd CourseAI
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Setup Environment Variables

Create a `.env` file:

```bash
cp .env.example .env
```

Then update it with your keys:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# YouTube
VITE_YOUTUBE_API_KEY=your_youtube_api_key

# Gemini AI
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### 4️⃣ Run the App

```bash
npm run dev
```

Visit: `http://localhost:5173`

-----

## 🌐 Deploying to Vercel

### 🔑 Add Environment Variables

Go to your Vercel Dashboard:

```
Project → Settings → Environment Variables
```

Add:

  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_YOUTUBE_API_KEY`
  - `VITE_GEMINI_API_KEY`

### 🔁 Enable SPA Routing

Create a `vercel.json` file:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

### 🚀 Push to Deploy

```bash
git add .
git commit -m "Add Vercel config and env setup"
git push
```

Vercel will deploy your app automatically. 🎉

-----

## 📁 Project Structure

```bash
.
├── src/
│   ├── components/     # UI components
│   ├── pages/          # Views (Home, Course)
│   ├── services/       # API integrations (YouTube, Gemini, Supabase)
│   └── App.tsx         # Main app structure
├── public/
│   └── _redirects      # SPA fallback for Netlify
├── vercel.json         # Vercel routing config
└── .env.example        # Example env file
```

-----

## 📝 Notes & Recommendations

  - ⚠️ **API Quotas**: YouTube & Gemini APIs have usage limits. Use locally to avoid quota-related disruptions.
  - 🔐 **Authentication**: Sign-in/Sign-up was implemented using Supabase Auth but is currently removed due to deployment limitations.
  - ⏳ **Personal Note**: As a solo developer with a tight schedule, progress is ongoing but not daily.
  - 🧪 **Best Tip**: Run locally for the most stable experience and full feature access.

-----

## 🙏 Credits

  - 🤖 **Course Generation**: Gemini AI (Google DeepMind)
  - 📺 **Video Curation**: YouTube Data API
  - 💬 **Comments Backend**: Supabase
  - ⚙️ **Base Architecture & Prompt Logic**: Built with Bolt AI

Thank you, **Bolt AI**, for providing free access — it made this project possible\!

-----

## 💡 Contributing

🎯 This project is open-source and in active development — your feedback and contributions are welcome\!

  - Open an issue for bugs, feature ideas, or suggestions.
  - Submit pull requests to improve functionality or polish UI.

Let’s build the future of education, one prompt at a time. 🚀
