#!/bin/bash

echo "🚀 Prediction Terminal - Setup Script"
echo "======================================"
echo ""

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "✓ .env.local file found"
else
    echo "⚠️  .env.local not found. Creating from template..."
    cp .env.example .env.local
    echo "✓ Created .env.local - Please fill in your API keys"
    echo ""
    echo "Open .env.local and add your credentials before continuing."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

echo "✓ Node.js $(node --version) detected"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✓ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Generate a secure CRON_SECRET if not set
if ! grep -q "CRON_SECRET=your_random_secret_string" .env.local; then
    echo "✓ CRON_SECRET is already set"
else
    echo ""
    echo "🔐 Generating secure CRON_SECRET..."
    SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    # Use a temporary file to avoid issues with in-place editing
    sed "s/CRON_SECRET=your_random_secret_string/CRON_SECRET=$SECRET/" .env.local > .env.local.tmp && mv .env.local.tmp .env.local
    echo "✓ CRON_SECRET generated and saved to .env.local"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Fill in all API keys in .env.local"
echo "2. Set up your Supabase database (see SETUP.md)"
echo "3. Run 'npm run dev' to start the development server"
echo "4. Visit http://localhost:3000 to see your dashboard"
echo ""
echo "For detailed setup instructions, see SETUP.md"
