# 📚 CourseAI — *One Prompt to Learn Anything*

**CourseAI** is an AI-powered course generator that transforms a single prompt into a full-fledged educational experience—complete with curated YouTube videos, interactive comments, and a sleek user interface.

> 🚧 **Under active development:** For the best results, it is recommended to **run the application locally** to avoid potential API quota issues.

-----

## 🚀 Features

  - ✨ **Generate Complete Educational Courses:** Utilizes **Gemini AI** to create comprehensive course content from a single prompt.
  - 🎥 **Curated YouTube Video Content:** Integrates relevant YouTube videos for each topic using the **YouTube Data API**.
  - 💬 **Built-in Commenting System:** Powered by **Supabase** to facilitate user discussions.
  - 🌗 **Beautiful UI with Dark/Light Mode:** Offers a visually appealing and customizable user interface.
  - ⚡ **Instant Deployment-Ready:** Includes a Vercel configuration for seamless deployment.

-----

## 🔧 Tech Stack

| Layer | Tech |
| :--- | :--- |
| **Frontend** | React + TypeScript + Vite |
| **Styling** | Tailwind CSS |
| **AI API** | Gemini (Google DeepMind) |
| **Video API** | YouTube Data API |
| **Backend** | Supabase (Authentication not yet implemented) |
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

Create a `.env` file by copying the example file:

```bash
cp .env.example .env
```

Then, fill in your credentials in the `.env` file:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# YouTube API Configuration
VITE_YOUTUBE_API_KEY=your_youtube_api_key

# Gemini AI API Configuration
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### 4️⃣ Run the App

```bash
npm run dev
```

Open your browser and navigate to: 👉 `http://localhost:5173`

-----

## 🌐 Vercel Deployment

### 🔑 Add Environment Variables

In your Vercel Dashboard, navigate to:
**Project → Settings → Environment Variables**

Add the following variables:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_YOUTUBE_API_KEY
VITE_GEMINI_API_KEY
```

### 🔁 Enable SPA Routing

Create a `vercel.json` file in the root of your project with the following content:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

### 🚀 Push to Deploy

Commit your changes and push to your Git repository:

```bash
git add .
git commit -m "Add Vercel config and env setup"
git push
```

Vercel will automatically deploy your application. 🎉

-----

## 📁 Project Structure

```
.
├── src/
│   ├── components/      # UI components
│   ├── pages/           # Views (Home, Course)
│   ├── services/        # API integrations (YouTube, Gemini, Supabase)
│   └── App.tsx          # Main app structure
├── public/
│   └── _redirects       # SPA fallback for Netlify
├── vercel.json          # Vercel routing config
└── .env.example         # Example env file
```

-----

## 📝 Notes & Recommendations

  - ⚠️ **API Quotas:** The YouTube and Gemini APIs have rate limits. Expect potential failures if these limits are exceeded.
  - 🔐 **Authentication:** Sign-in/Sign-up features are planned for a future release.
  - 🧪 **Best Tip:** For the smoothest experience and to avoid API quota throttling, use the local development environment.

-----

## 🙏 Credits

  - 🤖 **Course Generation:** Gemini AI (Google DeepMind)
  - 📺 **Video Curation:** YouTube Data API
  - 💬 **Comments Backend:** Supabase
  - ⚡ **Architecture Inspiration:** Bolt AI

-----

## 💡 Contributing

We welcome contributions to CourseAI\!

  - 🛠 Feel free to open issues or submit pull requests.
  - This project is in active development, and your ideas are valuable\!
