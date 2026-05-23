# 🎯 InterviewAI

> AI-powered mock interview coach with real-time voice analytics, filler word detection, and personalized learning paths for every tech role.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/interviewai)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/YOUR_USERNAME/interviewai)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎙 **Voice mock interviews** | AI speaks questions via TTS, you answer by voice (Web Speech API — free) |
| 📊 **Real-time speech analytics** | Live filler word detection, pace meter, clarity & confidence scores |
| 🧠 **Resume intelligence** | Upload resume → Claude extracts gaps, strengths, readiness score |
| 🎯 **Personalized questions** | Questions tailored to your role, tech stack, and seniority level |
| 📈 **Post-session report** | Full scorecard, learning path, resource recommendations |
| 💳 **Token-based billing** | 4 pricing tiers with Stripe subscriptions + token top-ups |
| 🔒 **Secure by default** | Supabase RLS, no API keys in frontend |

---

## 🚀 Quick Start

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/interviewai.git
cd interviewai

# 2. Install
npm install

# 3. Configure environment
cp .env.example .env.local
# → Fill in your Supabase, Anthropic, and Stripe keys

# 4. Run
npm run dev
# → Open http://localhost:3000
```

---

## 🏗 Tech Stack

| Layer | Technology | Cost |
|---|---|---|
| Frontend | React 18 + Vite | Free |
| Database + Auth | Supabase | Free tier |
| AI Engine | Claude API (Haiku + Sonnet) | ~$3–8/1000 sessions |
| Voice | Web Speech API (browser-native) | Free |
| Payments | Stripe | 2.9% + 30¢ per transaction |
| Hosting | Vercel / Netlify | Free tier |

**Total infrastructure cost: ~$3–8/month for 1,000 full sessions**

---

## 🗄 Database Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the schema from the app's "View DB Schema" button, or paste from `supabase/schema.sql`
3. Copy your project URL and anon key into `.env.local`

### Tables

```
users_profile     — plan, token usage, billing date
user_usage        — per-feature token consumption log
interview_sessions — questions, answers, scores, reports
transactions      — Stripe payment history
```

---

## 💳 Stripe Setup

1. Create products in [Stripe Dashboard](https://dashboard.stripe.com)
2. Create 2 recurring prices: **Starter** ($9/mo) and **Pro** ($24/mo)
3. Copy price IDs to `.env.local`
4. Set up webhook endpoint: `https://your-domain.com/api/stripe-webhook`
5. Add webhook secret to `.env.local`

---

## 📦 Deployment

### Vercel (recommended)
```bash
npm i -g vercel
vercel --prod
# Add environment variables in Vercel Dashboard → Settings → Environment Variables
```

### Netlify
```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

---

## 🏷 Pricing Tiers

| Plan | Price | Tokens | Sessions | Voice |
|---|---|---|---|---|
| Free | $0/mo | 50K | 3 | ✗ |
| Starter | $9/mo | 300K | 15 | ✓ |
| Pro | $24/mo | 1M | Unlimited | ✓ |
| Enterprise | Custom | Unlimited | Unlimited | ✓ |

**Token top-ups:** 100K for $2 · 500K for $8 · 1M for $14

---

## 🗺 Roadmap

- [ ] Supabase Edge Functions for secure Claude API proxy
- [ ] Stripe webhook handler for plan activation
- [ ] Eye contact detection via webcam (MediaPipe)
- [ ] Company-specific question packs (FAANG, startups)
- [ ] Peer-to-peer mock interview matching
- [ ] Mobile app (React Native)
- [ ] Team dashboard for bootcamps & companies

---

## 📁 Project Structure

```
interviewai/
├── src/
│   ├── main.jsx          # React entry point
│   └── App.jsx           # Full application (all screens + components)
├── public/
│   └── favicon.svg
├── supabase/
│   └── schema.sql        # Database schema (copy from app's Schema screen)
├── index.html
├── vite.config.js
├── vercel.json
├── netlify.toml
└── .env.example
```

---

## 🔐 Security Notes

- The Anthropic API key must **never** be in the frontend. Use a Supabase Edge Function as a proxy (see roadmap).
- For the demo/MVP, calls go directly to the Anthropic API. Before going to production, move this server-side.
- Supabase Row Level Security (RLS) is enabled on all user tables.

---

## 📄 License

MIT — free to use, modify, and deploy commercially.

---

Built with ❤️ using [Claude](https://claude.ai) · [React](https://react.dev) · [Vite](https://vitejs.dev) · [Supabase](https://supabase.com)
