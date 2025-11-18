# Configure Environment Variables For Local Use

The following instructions are crucial as they are needed to connect to Supabase. Contact the developers to get the credentials needed, and then follow these instructions below.

## Frontend 

1. In the `frontend/` directory, create a `.env` file:
   ```bash
   cd frontend
   cp .env.example .env
   ```

2. Edit `.env` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```

## Backend

1. In the `backend/` directory, create a `.env` file:
    ```bash
    cd backend
    cp .env.example .env
    ```

2. Edit `.env` and add your Supabase connection string:
   ```env
   DATABASE_URL=postgresql+psycopg2://postgres.frqwdgcqcvveozdorcoz:[YOUR_DB_PASSWORD]@aws-0-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require
   ```