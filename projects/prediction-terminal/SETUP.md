# Prediction Terminal - Setup Guide

Complete setup instructions for your Bloomberg-style prediction market monitoring system.

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- A Supabase account (free tier works)
- OpenAI API key with GPT-4 access
- API keys for data sources (GummySearch, Parse.bot, Exa.ai)
- Slack workspace with admin access
- Vercel account (for deployment)

## 🚀 Step-by-Step Setup

### 1. Database Setup (Supabase)

1. **Create a new Supabase project:**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Wait for the database to be provisioned

2. **Run the database migration:**
   - In the Supabase dashboard, go to SQL Editor
   - Create a new query
   - Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
   - Click "Run" to execute the migration

3. **Get your API credentials:**
   - Go to Project Settings → API
   - Copy your `Project URL` and `anon/public` key
   - Copy your `service_role` key (keep this secret!)

### 2. API Keys Setup

#### OpenAI
1. Go to [platform.openai.com](https://platform.openai.com)
2. Navigate to API keys
3. Create a new secret key
4. Copy and save it securely

#### GummySearch (Reddit)
1. Sign up at [gummysearch.com](https://gummysearch.com)
2. Go to API settings
3. Generate an API key
4. Copy and save it

#### Parse.bot (Twitter)
1. Sign up at [parse.bot](https://parse.bot)
2. Access your dashboard
3. Generate an API key
4. Copy and save it

#### Exa.ai (Web Search)
1. Sign up at [exa.ai](https://exa.ai)
2. Go to your dashboard
3. Create an API key
4. Copy and save it

### 3. Slack Integration

1. **Create a Slack App:**
   - Go to [api.slack.com/apps](https://api.slack.com/apps)
   - Click "Create New App" → "From scratch"
   - Name it "Prediction Terminal"
   - Select your workspace

2. **Enable Incoming Webhooks:**
   - In your app settings, go to "Incoming Webhooks"
   - Toggle "Activate Incoming Webhooks" to ON
   - Click "Add New Webhook to Workspace"
   - Select the channel where you want alerts (e.g., #prediction-markets)
   - Copy the Webhook URL

3. **Get the Channel ID:**
   - Right-click on the channel in Slack
   - Copy link
   - The channel ID is the last part of the URL

### 4. Environment Variables

1. **Create `.env.local` file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Fill in your credentials:**
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

   # OpenAI
   OPENAI_API_KEY=sk-your-openai-key-here

   # External APIs
   GUMMYSEARCH_API_KEY=your_gummysearch_key_here
   PARSEBOT_API_KEY=your_parsebot_key_here
   EXA_API_KEY=your_exa_key_here

   # Slack
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   SLACK_CHANNEL_ID=C1234567890

   # Vercel Cron Secret (generate a random string)
   CRON_SECRET=your_random_secret_string_here
   ```

3. **Generate a secure cron secret:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

### 5. Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open the dashboard:**
   - Navigate to [http://localhost:3000](http://localhost:3000)
   - You should see the Bloomberg-style terminal interface

4. **Test the cron endpoints manually (optional):**
   ```bash
   # Reddit scan
   curl http://localhost:3000/api/cron/scan-reddit \
     -H "Authorization: Bearer YOUR_CRON_SECRET"

   # Twitter scan
   curl http://localhost:3000/api/cron/scan-twitter \
     -H "Authorization: Bearer YOUR_CRON_SECRET"

   # Web scan
   curl http://localhost:3000/api/cron/scan-web \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

### 6. Deploy to Vercel

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Set environment variables in Vercel:**
   - Go to your project in the Vercel dashboard
   - Navigate to Settings → Environment Variables
   - Add all variables from your `.env.local` file
   - Make sure to add them for Production, Preview, and Development

5. **Deploy to production:**
   ```bash
   vercel --prod
   ```

### 7. Verify Cron Jobs

1. **Check cron configuration:**
   - In Vercel dashboard, go to your project
   - Click on "Cron Jobs" tab
   - You should see 4 cron jobs configured:
     - Reddit scan (every 15 minutes)
     - Twitter scan (every 30 minutes)
     - Web scan (every hour)
     - Cleanup (every 6 hours)

2. **Test cron jobs:**
   - Click "Trigger" on each cron job to test manually
   - Check your Slack channel for system notifications
   - Check the dashboard for new trends

## 🎯 Usage

### Dashboard Features

- **Real-time Updates**: The dashboard updates automatically when new trends are detected
- **Filtering**: Filter by market potential (high/medium) and source (Reddit/Twitter/Web)
- **Trend Cards**: Each card shows:
  - Source and market potential
  - AI-generated summary
  - Confidence score
  - Engagement metrics
  - Suggested market structures
  - Link to original source

### Slack Alerts

When high or medium potential trends are detected, you'll receive formatted Slack messages with:
- Market opportunity summary
- Source and confidence information
- Suggested prediction markets
- Direct link to the original source

### API Endpoints

- `GET /api/trends` - Fetch trends with filtering
- `GET /api/cron/scan-reddit` - Manually trigger Reddit scan
- `GET /api/cron/scan-twitter` - Manually trigger Twitter scan
- `GET /api/cron/scan-web` - Manually trigger web scan
- `GET /api/cron/cleanup` - Manually trigger cleanup

## 🔧 Customization

### Adjust Scanning Frequency

Edit `vercel.json` to change cron schedules:
```json
{
  "crons": [
    {
      "path": "/api/cron/scan-reddit",
      "schedule": "*/15 * * * *"  // Change this
    }
  ]
}
```

### Modify Source Subreddits

Edit `lib/services/reddit.ts`:
```typescript
export const PREDICTION_MARKET_SUBREDDITS = [
  'wallstreetbets',
  'politics',
  // Add your subreddits here
];
```

### Customize AI Analysis Prompt

Edit `lib/services/openai.ts` to modify how trends are analyzed for market potential.

### Adjust Slack Message Format

Edit `lib/services/slack.ts` to customize the Slack message appearance.

## 📊 Monitoring

### Database

- Use Supabase dashboard to view trends, analyses, and alerts
- Monitor API usage in source_metadata table
- Check the high_potential_trends view for quick insights

### Logs

- Vercel dashboard shows function logs
- Check for errors in cron job executions
- Monitor API rate limits

### Performance

- Each cron job has a 60-second timeout
- Adjust batch sizes if hitting timeouts
- Monitor OpenAI API usage and costs

## 🐛 Troubleshooting

### Cron jobs not running
- Verify CRON_SECRET is set in Vercel environment variables
- Check function logs for errors
- Ensure your Vercel plan supports cron jobs

### No trends appearing
- Check API keys are valid
- Verify database connection
- Look at cron job logs for errors
- Test API endpoints manually

### Slack notifications not working
- Verify webhook URL is correct
- Check Slack app permissions
- Test webhook with curl

### Database errors
- Ensure migration ran successfully
- Check Supabase service status
- Verify service role key is set

## 🔐 Security Notes

- Never commit `.env.local` to git
- Keep your service role key secret
- Rotate API keys periodically
- Use Vercel's secret management
- Monitor API usage for anomalies

## 📈 Next Steps

- Add more data sources
- Implement user authentication
- Create trend history visualizations
- Add market creation workflow
- Build trend similarity detection
- Implement sentiment analysis
- Add RSS feed support
- Create mobile app

## 🎉 You're Ready!

Your Prediction Terminal is now live and monitoring trends across Reddit, Twitter, and the web. Check your dashboard and Slack channel for real-time market opportunities!
