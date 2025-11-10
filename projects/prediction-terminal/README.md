# Prediction Terminal

Bloomberg Terminal for Prediction Markets - An AI-powered trend monitoring system that automatically detects trending topics across Reddit, Twitter/X, and the web, analyzes them for prediction market potential, and posts alerts to Slack.

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Hosting**: Vercel (serverless functions + cron jobs)
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4 Turbo
- **Notifications**: Slack (webhooks)
- **External APIs**: GummySearch (Reddit), Parse.bot (Twitter), Exa.ai (Web search)

## Features

- 🔍 **Multi-Source Monitoring**: Aggregates trends from Reddit, Twitter, and web sources
- 🤖 **AI-Powered Analysis**: Uses GPT-4 to evaluate market potential and generate insights
- ⚡ **Real-Time Alerts**: Instant Slack notifications for actionable opportunities
- 📊 **Terminal Dashboard**: Bloomberg-style interface for monitoring trends
- ⏰ **Automated Scanning**: Vercel cron jobs run periodic trend detection
- 💾 **Historical Tracking**: PostgreSQL database stores all trends and analyses

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- OpenAI API key
- API keys for GummySearch, Parse.bot, and Exa.ai
- Slack workspace with webhook configured

### Installation

1. Clone and install dependencies:
```bash
cd prediction-terminal
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your actual API keys
```

3. Set up Supabase database:
```bash
# Run the SQL migrations in supabase/migrations/
```

4. Run development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the dashboard.

## Project Structure

```
prediction-terminal/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── cron/         # Vercel cron jobs
│   │   ├── sources/      # Data source integrations
│   │   └── trends/       # Trend management
│   ├── dashboard/        # Main dashboard UI
│   └── layout.tsx        # Root layout
├── lib/                   # Core utilities
│   ├── supabase/         # Database client & types
│   ├── services/         # Business logic
│   │   ├── reddit.ts     # GummySearch integration
│   │   ├── twitter.ts    # Parse.bot integration
│   │   ├── web.ts        # Exa.ai integration
│   │   ├── openai.ts     # GPT-4 analysis
│   │   └── slack.ts      # Slack notifications
│   └── types/            # TypeScript definitions
├── components/           # React components
│   ├── trends/          # Trend display components
│   └── ui/              # Reusable UI components
├── supabase/
│   └── migrations/      # Database schema
└── vercel.json          # Vercel cron configuration
```

## Deployment

Deploy to Vercel:

```bash
vercel
```

Set environment variables in Vercel dashboard and the cron jobs will automatically run.

## Cron Schedule

- **Every 15 minutes**: Scan Reddit trends (high priority)
- **Every 30 minutes**: Scan Twitter trends
- **Every hour**: Scan web trends via Exa.ai
- **Every 6 hours**: Clean up old analyzed trends

## License

MIT
