# Prediction Terminal - Architecture

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     PREDICTION TERMINAL                      │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  Data Sources    │    │   Processing     │    │   Outputs        │
├──────────────────┤    ├──────────────────┤    ├──────────────────┤
│                  │    │                  │    │                  │
│ 🔴 Reddit        │───▶│ Vercel Cron Jobs │───▶│ 📊 Dashboard     │
│   (GummySearch)  │    │                  │    │   (Next.js)      │
│                  │    │ ┌──────────────┐ │    │                  │
│ 🐦 Twitter       │───▶│ │ AI Analysis  │ │───▶│ 💬 Slack Alerts  │
│   (Parse.bot)    │    │ │ (GPT-4)      │ │    │   (Webhooks)     │
│                  │    │ └──────────────┘ │    │                  │
│ 🌐 Web           │───▶│                  │───▶│ 💾 Database      │
│   (Exa.ai)       │    │ Supabase Client  │    │   (PostgreSQL)   │
│                  │    │                  │    │                  │
└──────────────────┘    └──────────────────┘    └──────────────────┘
```

## 📁 Project Structure

```
prediction-terminal/
│
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── cron/                # Serverless cron jobs
│   │   │   ├── scan-reddit/     # Reddit trend scanner
│   │   │   ├── scan-twitter/    # Twitter trend scanner
│   │   │   ├── scan-web/        # Web trend scanner
│   │   │   └── cleanup/         # Database cleanup
│   │   └── trends/              # Trends API
│   ├── dashboard/               # Main dashboard page
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home (redirects to dashboard)
│
├── components/                   # React components
│   ├── trends/                  # Trend-related components
│   │   ├── TrendCard.tsx        # Individual trend display
│   │   ├── StatsBar.tsx         # System statistics
│   │   └── FilterBar.tsx        # Filtering controls
│   └── ui/                      # Reusable UI components
│
├── lib/                         # Core utilities and services
│   ├── supabase/               # Database client
│   │   └── client.ts           # Supabase configuration
│   ├── services/               # Business logic
│   │   ├── reddit.ts           # Reddit API integration
│   │   ├── twitter.ts          # Twitter API integration
│   │   ├── web.ts              # Web search integration
│   │   ├── openai.ts           # AI analysis service
│   │   └── slack.ts            # Slack notifications
│   └── types/                  # TypeScript definitions
│       └── database.ts         # Database types
│
├── supabase/                    # Database schema
│   └── migrations/
│       └── 001_initial_schema.sql
│
├── scripts/                     # Utility scripts
│   └── setup.sh                # Automated setup
│
├── .env.example                 # Environment template
├── vercel.json                  # Vercel cron config
├── README.md                    # Project overview
├── SETUP.md                     # Setup instructions
└── ARCHITECTURE.md              # This file
```

## 🔄 Data Flow

### 1. Trend Detection

```
External API → Cron Job → Database (trends table)
```

**Process:**
1. Vercel cron triggers at scheduled intervals
2. Fetches trending content from data sources
3. Checks for duplicates using `(source, source_id)` unique constraint
4. Inserts new trends with status `analyzing`

### 2. AI Analysis

```
Trend → OpenAI GPT-4 → Analysis (stored in analyses table)
```

**Process:**
1. For each new trend, extract key information
2. Send to GPT-4 with specialized prompt
3. Receive structured analysis:
   - Market potential (high/medium/low/none)
   - Confidence score (0-1)
   - Summary and reasoning
   - Suggested market structures
   - Keywords
4. Store analysis linked to trend

### 3. Alert Distribution

```
High/Medium Potential → Slack Webhook → Team Notification
```

**Process:**
1. Check if trend has high or medium potential
2. Format rich Slack message with blocks
3. Send to configured webhook
4. Record alert in alerts table
5. Update trend status to `alerted`

### 4. Dashboard Display

```
Database View → Real-time Subscription → Dashboard Update
```

**Process:**
1. Dashboard queries `high_potential_trends` view
2. Supabase real-time subscription detects changes
3. Dashboard automatically refreshes
4. Users can filter by potential and source

## 🗄️ Database Schema

### Core Tables

**trends**
- Stores detected trends from all sources
- Unique constraint on (source, source_id)
- Tracks engagement and status

**analyses**
- AI-generated insights for each trend
- Links to trends via foreign key
- Contains market potential assessment

**alerts**
- Records sent Slack notifications
- Links to both trends and analyses
- Tracks Slack message timestamps

**source_metadata**
- Monitors API health and usage
- One row per data source
- Tracks scan status and frequency

### Enums

- `source_type`: reddit, twitter, web
- `trend_status`: pending, analyzing, analyzed, alerted, dismissed
- `market_potential`: high, medium, low, none

### Indexes

Optimized for:
- Status-based queries
- Time-range queries
- Source filtering
- Engagement sorting

## ⚙️ Key Technologies

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Supabase Client**: Real-time database subscriptions

### Backend
- **Vercel Serverless**: Cron jobs and API routes
- **Supabase**: PostgreSQL database with real-time
- **OpenAI GPT-4**: Trend analysis
- **External APIs**: Data aggregation

### Infrastructure
- **Vercel**: Hosting and cron jobs
- **Supabase**: Database hosting
- **Slack**: Notification delivery

## 🔐 Security Considerations

### API Keys
- All sensitive keys in environment variables
- Service role key only used server-side
- Cron endpoints protected with bearer token

### Database
- Row-level security can be added
- Service role bypasses RLS for cron jobs
- Public anon key for dashboard (read-only views)

### Rate Limiting
- Cron jobs process limited batches
- Delays between API calls
- Metadata tracks daily API usage

## 🚀 Deployment

### Development
```bash
npm run dev
```
- Local Next.js server on :3000
- Hot reload enabled
- Can test cron endpoints manually

### Production
```bash
vercel --prod
```
- Deploys to Vercel edge network
- Environment variables from dashboard
- Cron jobs automatically configured

## 📊 Monitoring & Observability

### Metrics to Track
- **Trends per hour**: Detection rate
- **High potential ratio**: Quality of detection
- **API usage**: Cost tracking
- **Cron job duration**: Performance
- **Error rates**: System health

### Logging
- Vercel function logs
- Supabase query logs
- Slack system notifications

### Alerts
- Cron job failures → Slack
- High-potential trends → Slack
- Database errors → Console logs

## 🔧 Customization Points

### Add New Data Sources
1. Create service in `lib/services/`
2. Add cron job in `app/api/cron/`
3. Update `source_type` enum
4. Add source to `source_metadata`

### Modify AI Analysis
- Edit prompt in `lib/services/openai.ts`
- Adjust confidence thresholds
- Add custom evaluation criteria

### Customize Dashboard
- Modify components in `components/`
- Add new filters or views
- Change color scheme in Tailwind config

### Extend Database
- Add migration in `supabase/migrations/`
- Update types in `lib/types/database.ts`
- Modify queries as needed

## 📈 Scaling Considerations

### Current Limits
- **Cron frequency**: 4 jobs (15min, 30min, 1h, 6h)
- **Batch size**: ~20-50 trends per scan
- **Timeout**: 60 seconds per function
- **Database**: Supabase free tier

### To Scale Up
1. **Increase cron frequency**: Edit `vercel.json`
2. **Parallel processing**: Add more workers
3. **Database optimization**: Add indexes, partitioning
4. **Caching**: Add Redis for frequently accessed data
5. **Queue system**: Replace cron with message queue
6. **Load balancing**: Multiple Vercel regions

## 🎯 Performance Optimization

### Current Optimizations
- Database indexes on common queries
- Batch processing in cron jobs
- Efficient Supabase queries
- Real-time subscriptions (not polling)

### Future Improvements
- Implement caching layer
- Optimize AI prompt length
- Parallel API calls where possible
- Pre-compute dashboard metrics
- Use Vercel Edge Functions for lower latency

## 🧪 Testing Strategy

### Unit Tests
- Service functions (reddit, twitter, web, openai, slack)
- Type validation
- Utility functions

### Integration Tests
- API endpoints
- Database operations
- End-to-end trend processing

### Manual Testing
- Cron job execution
- Dashboard real-time updates
- Slack notification formatting
- Filter and search functionality

---

Built with ❤️ for the Polymarket team
