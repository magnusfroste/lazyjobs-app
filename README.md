# LazyJobs

> 🚀 **Swipe. Match. Get Hired.** The lazy way to land your dream job.

LazyJobs is a Tinder-like job matching platform powered by AI. Upload your CV, swipe through personalized job matches, and get AI-generated application materials—all in one seamless experience.

---

## ✨ Features

- 📄 **CV-based matching**: Upload your CV and get jobs matched to your skills
- 🎯 **Smart job recommendations**: AI analyzes your profile and ranks jobs by fit
- 👆 **Swipe interface**: Tinder-like UX for browsing opportunities
- 🤖 **AI application assistant**: Generate cover letters and answers in seconds
- 📊 **Skill gap analysis**: See what skills you need to level up
- 🌍 **Multi-source aggregation**: Jobs from Arbetsförmedlingen, EURES, Remotive, and more

---

## 🏗️ Architecture

LazyJobs uses a **3-server architecture**:

1. **Vercel** - React/Vite frontend (auto-deploys from GitHub)
2. **Supabase** - Backend with PostgreSQL, auth, and edge functions
3. **Easypanel** - OpenJobs connector (Docker container fetching & enriching jobs)

See [`DEPLOYMENT.md`](DEPLOYMENT.md) for the full architecture and deployment guide.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account (or use existing project)

### Local Development

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd lazyjobs

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

Visit `http://localhost:8080` to see the app.

---

## 📁 Project Structure

```
lazyjobs/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── pages/             # Route pages
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API service layer
│   └── integrations/      # Supabase client
├── supabase/              # Backend
│   ├── functions/         # Edge functions (auto-deployed)
│   └── migrations/        # Database schema
├── connectors/            # Data pipeline (NOT deployed to Vercel)
│   └── openjobs/          # OpenJobs connector (runs on Easypanel)
├── docs/                  # Documentation
└── ref/                   # Reference implementation
```

---

## 🛠️ Technologies

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **UI**: shadcn/ui, Framer Motion
- **Deployment**: Vercel (frontend), Supabase (backend), Easypanel (connector)

---

## 📚 Documentation

- [Deployment Guide](DEPLOYMENT.md) - Full deployment instructions
- [OpenJobs Integration](docs/setup/OPENJOBS_INTEGRATION.md) - Connector setup
- [Architecture](connectors/README.md) - Data flow and connector architecture

---

## 🚢 Deployment

### Deploy to Vercel

```bash
# Push to GitHub (auto-deploys)
git push origin main
```

See [`DEPLOYMENT.md`](DEPLOYMENT.md) for environment variables and configuration.

### Custom Domain

Connect a custom domain in the Vercel dashboard:
1. Go to Project Settings → Domains
2. Add your domain
3. Configure DNS as instructed

---

## 🤝 Contributing

This is a private project. If you have access, feel free to open issues or submit PRs.

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

---

## Edit your project

You can edit your project by:
- Using the Lovable web interface at [lovable.dev/projects/c047a2c8-dc89-4a67-9c08-58c1ecb98372](https://lovable.dev/projects/c047a2c8-dc89-4a67-9c08-58c1ecb98372)
- Cloning the repository locally (see Getting Started above)
