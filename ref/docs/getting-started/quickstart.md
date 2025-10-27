# Quick Start Guide

Get JobMatch running in 10 minutes!

## 1. Get Your Supabase Credentials

1. Go to https://arqugyvmegxonaerjbzd.supabase.co
2. Navigate to **Settings** → **API**
3. Copy your **Project URL** and **anon public** key

## 2. Configure Environment

Update `.env` file:

```bash
VITE_SUPABASE_URL=https://arqugyvmegxonaerjbzd.supabase.co
VITE_SUPABASE_ANON_KEY=paste_your_anon_key_here
```

## 3. Set Up Database

1. Open Supabase Dashboard → **SQL Editor**
2. Click **New Query**
3. Copy all contents from `supabase/schema.sql`
4. Paste and click **Run**

✅ You should see "Success. No rows returned"

## 4. Add Sample Jobs

1. In SQL Editor, create another **New Query**
2. Copy contents from `scripts/add-sample-jobs.sql`
3. Paste and click **Run**

✅ You should see "10 rows" returned

## 5. Enable Email Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. (Optional) Configure email templates

## 6. Install & Run

```bash
# Install dependencies (if not done)
npm install

# Start development server
npm run dev
```

## 7. Test the App

1. Open http://localhost:5173
2. Click **Sign Up**
3. Create an account with your email
4. Check your email for confirmation link
5. Click the link to verify
6. Start swiping! 🎉

## Troubleshooting

### "Missing Supabase environment variables"
- Make sure `.env` file exists in project root
- Verify the values are correct (no quotes needed)
- Restart the dev server: `Ctrl+C` then `npm run dev`

### "No jobs showing"
- Run the sample jobs SQL script
- Check Supabase → **Table Editor** → **jobs** table
- Make sure `is_active = true`

### Email not arriving
- Check spam folder
- In Supabase → **Authentication** → **Users**, verify user exists
- For development, check Supabase logs for email content

### Can't sign in
- Verify email is confirmed (check Users table)
- Try password reset
- Check browser console for errors

## Next Steps

- **Add more jobs**: Run connectors or manually insert
- **Customize UI**: Edit components in `src/components/`
- **Deploy**: See `DEPLOYMENT.md`
- **Create connectors**: See `CONNECTOR_API.md`

## Quick Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build

# Linting
npm run lint         # Check code quality
```

## Project Structure

```
pipeline_x/
├── src/
│   ├── components/      # React components
│   │   ├── Auth.jsx            # Login/signup
│   │   ├── JobCard.jsx         # Swipeable card
│   │   └── SwipeInterface.jsx  # Main UI
│   ├── lib/
│   │   └── supabase.js  # Supabase client
│   └── App.jsx          # Main app
├── supabase/
│   ├── schema.sql       # Database schema
│   └── functions/       # Edge functions
└── examples/            # Connector examples
```

## Support

- **Documentation**: See README.md
- **Setup Issues**: See SETUP.md
- **Deployment**: See DEPLOYMENT.md
- **Connectors**: See CONNECTOR_API.md

Happy swiping! 🚀
