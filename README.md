

# 📚 CourseAI — One Prompt to Learn Anything

**CourseAI** is an AI-powered platform that transforms a single prompt into a complete educational experience — featuring curated YouTube videos, editable course modules, and a fully responsive, modern UI.

> 🧑‍💻 **Designed, built, and refined entirely by me** as a solo developer — using cutting-edge tools like Gemini AI, Supabase, and the YouTube Data API to power real-world learning experiences.

---

## 🚧 Project Status

The platform is fully functional and actively evolving. Some features (like authentication) are temporarily disabled due to deployment constraints. Running locally is recommended for the best experience due to API quota limits.

---

## 🚀 Key Features

* ✨ **AI-Generated Course Content**
  Generates structured, multi-topic courses from a single prompt using Gemini AI.

* 🎥 **Curated YouTube Video Integration**
  Embeds relevant educational videos dynamically using the YouTube Data API.

* 📝 **Editable Course Flow**
  Users can edit course titles, modules, and content before publishing.

* 💬 **Built-in Comment System**
  Supports user interaction via Supabase-backed comments.

* 🌗 **Dark & Light Mode Support**
  Clean and accessible interface with full theming support.

* ⚡ **Vercel-Ready Deployment**
  Pre-configured for fast and easy cloud deployment.

---

## 🛠 Tech Stack

| Layer     | Technology                     |
| --------- | ------------------------------ |
| Frontend  | React + TypeScript + Vite      |
| Styling   | Tailwind CSS                   |
| AI Engine | Gemini API (Google DeepMind)   |
| Video API | YouTube Data API               |
| Backend   | Supabase (Postgres + Realtime) |
| Hosting   | Vercel                         |

---

## ⚙️ Getting Started (Local Development)

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

Then add your API keys:

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

Access the app at `http://localhost:5173`

---

## 🌐 Deploying to Vercel

### 🔐 Add Environment Variables

On your Vercel project dashboard, add:

* `VITE_SUPABASE_URL`
* `VITE_SUPABASE_ANON_KEY`
* `VITE_YOUTUBE_API_KEY`
* `VITE_GEMINI_API_KEY`

### 🔁 Configure Routing

Create a `vercel.json` file for SPA support:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

### 🚀 Deploy

```bash
git add .
git commit -m "Configure Vercel deployment"
git push
```

Done — Vercel will handle the deployment!

---

## 📁 Project Structure

```
.
├── src/
│   ├── components/     # UI components
│   ├── pages/          # App views (Home, Course, etc.)
│   ├── services/       # External APIs (YouTube, Gemini, Supabase)
│   └── App.tsx         # Main app logic
├── public/
│   └── _redirects      # SPA routing config
├── vercel.json         # Deployment rules
└── .env.example        # Env variable template
```

---

## 🙌 Credits

While this project is built entirely by me, I’d like to acknowledge:

* 💡 **Gemini API** – for enabling advanced AI-driven course creation
* 🎥 **YouTube Data API** – for surfacing high-quality video resources


---

## 💡 Contributing

Open-source contributions, feedback, or issue reports are welcome!

* Submit pull requests for improvements
* Report bugs or suggest features via Issues
* Star the repo if you find it useful 🌟

> Let’s redefine how we learn — one prompt at a time.

---

