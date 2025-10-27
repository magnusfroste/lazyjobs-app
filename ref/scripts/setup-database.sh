#!/bin/bash

# Setup Database Script
# This script runs the SQL files against your Supabase database

echo "🗄️  Setting up JobMatch database..."

# Get database connection string from .env or prompt
if [ -f .env ]; then
    source .env
fi

# You need to get your database password from Supabase Dashboard
# Settings → Database → Connection string (URI)
# Format: postgresql://postgres:[YOUR-PASSWORD]@db.arqugyvmegxonaerjbzd.supabase.co:5432/postgres

DB_URL="postgresql://postgres:[YOUR-PASSWORD]@db.arqugyvmegxonaerjbzd.supabase.co:5432/postgres"

echo "📋 Running schema.sql..."
psql "$DB_URL" -f supabase/schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Schema created successfully!"
    
    echo "📋 Running sample jobs..."
    psql "$DB_URL" -f scripts/add-sample-jobs.sql
    
    if [ $? -eq 0 ]; then
        echo "✅ Sample jobs added successfully!"
        echo ""
        echo "🎉 Database setup complete!"
        echo ""
        echo "Next steps:"
        echo "1. Run: npm run dev"
        echo "2. Sign up at http://localhost:5173"
        echo "3. Start swiping!"
    else
        echo "❌ Failed to add sample jobs"
    fi
else
    echo "❌ Failed to create schema"
fi
