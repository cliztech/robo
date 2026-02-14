# Phase 1: Database Architecture & Setup

**Timeline**: Day 2-3  
**Goal**: Complete database schema implementation and Supabase configuration

## Prerequisites

- [ ] Supabase account created
- [ ] Supabase project initialized
- [ ] Environment variables configured
- [ ] Phase 0 completed

## Step 1: Create Supabase Project

### 1.1: Create Project via Dashboard

1. Go to https://supabase.com/dashboard
2. Click **New Project**
3. Fill in:
   - **Name**: `aetherradio-prod`
   - **Database Password**: Generate strong password (save securely!)
   - **Region**: Select closest to your users
   - **Plan**: Free tier (for development)
4. Wait for project to be created (~2 minutes)

### 1.2: Get Project Credentials

1. Go to **Project Settings → API**
2. Copy the following:
   - **Project URL**: `https://xxx.supabase.co`
   - **Anon/Public Key**: `eyJhbGc...`
   - **Service Role Key**: `eyJhbGc...` (keep secret!)

### 1.3: Update Environment Variables

Edit `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 2: Apply Database Schema

### 2.1: Create Migration File

Create file: `supabase/migrations/001_initial_schema.sql`  
Copy the complete schema from `DATABASE_SCHEMA.md`.

### 2.2: Apply Migration via Dashboard

1. Go to **Supabase Dashboard → SQL Editor**
2. Click **New Query**
3. Paste the entire schema
4. Click **Run** (bottom right)
5. Verify success message

### 2.3: Verify Tables Created

Go to **Table Editor** and confirm these tables exist:

- `profiles`
- `stations`
- `tracks`
- `playlists`
- `playlist_tracks`
- `broadcast_history`
- `ai_decisions`
- `stream_sessions`
- `analytics_events`
- `notifications`

## Step 3: Setup Storage Buckets

### 3.1: Create Tracks Bucket

Go to **Storage → Create Bucket** with settings:

- **Name**: `tracks`
- **Public**: Off (private)
- **File size limit**: 500MB
- **Allowed MIME types**: `audio/mpeg, audio/mp3, audio/wav, audio/ogg, audio/flac, audio/aac, audio/m4a`

### 3.2: Create Artwork Bucket

Create another bucket:

- **Name**: `artwork`
- **Public**: On (public)
- **File size limit**: 10MB
- **Allowed MIME types**: `image/jpeg, image/png, image/webp`

### 3.3: Create Avatars Bucket

Create bucket:

- **Name**: `avatars`
- **Public**: On (public)
- **File size limit**: 2MB
- **Allowed MIME types**: `image/jpeg, image/png, image/webp`

## Step 4: Configure Storage Policies

### 4.1: Tracks Bucket Policies

Go to **Storage → tracks → Policies**.

Policy 1: Users can upload to own stations

```sql
CREATE POLICY "Users can upload tracks to own stations"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'tracks' AND
  auth.uid() IN (
    SELECT user_id FROM public.stations
    WHERE id::text = (storage.foldername(name))[1]
  )
);
```

Policy 2: Users can view own tracks

```sql
CREATE POLICY "Users can view own tracks"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'tracks' AND
  auth.uid() IN (
    SELECT user_id FROM public.stations
    WHERE id::text = (storage.foldername(name))[1]
  )
);
```

Policy 3: Users can delete own tracks

```sql
CREATE POLICY "Users can delete own tracks"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'tracks' AND
  auth.uid() IN (
    SELECT user_id FROM public.stations
    WHERE id::text = (storage.foldername(name))[1]
  )
);
```

### 4.2: Artwork Bucket Policies

Policy 1: Anyone can view

```sql
CREATE POLICY "Anyone can view artwork"
ON storage.objects FOR SELECT
USING (bucket_id = 'artwork');
```

Policy 2: Authenticated users can upload

```sql
CREATE POLICY "Users can upload artwork"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'artwork' AND auth.role() = 'authenticated');
```

## Step 5: Setup Supabase Client

### 5.1: Create Client Helpers

Create file: `src/lib/supabase/client.ts`

```ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'

export function createClient() {
  return createClientComponentClient<Database>()
}
```

Create file: `src/lib/supabase/server.ts`

```ts
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export function createServerClient() {
  return createServerComponentClient<Database>({
    cookies,
  })
}
```

### 5.2: Generate TypeScript Types

```bash
# Install Supabase CLI if not already
npm install -g supabase

# Login to Supabase
supabase login

# Link project
supabase link --project-ref your-project-ref

# Generate types
supabase gen types typescript --project-id your-project-id > src/types/database.ts
```

Or manually via Dashboard:

1. Go to **API Docs → TypeScript**
2. Copy generated types
3. Paste into `src/types/database.ts`

## Step 6: Configure Authentication

### 6.1: Enable Email Authentication

Go to **Authentication → Providers** and enable Email.

Settings:

- Enable email confirmations: **Yes** (for production)
- Enable email confirmations: **No** (for development)
- Secure email change: **Yes**

### 6.2: Enable OAuth Providers (Optional)

#### Google

1. Create OAuth credentials in Google Cloud Console
2. Copy Client ID and Client Secret
3. In Supabase → **Authentication → Providers → Google**:
   - Enable Google
   - Paste credentials
   - Save

#### GitHub

1. Create OAuth App in GitHub Settings
2. Copy Client ID and Client Secret
3. In Supabase → **Authentication → Providers → GitHub**:
   - Enable GitHub
   - Paste credentials
   - Save

### 6.3: Configure Email Templates

Go to **Authentication → Email Templates**.

Confirm Signup:

```html
<h2>Confirm your email</h2>
<p>Welcome to AetherRadio! Please confirm your email address.</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
```

Reset Password:

```html
<h2>Reset your password</h2>
<p>Click the link below to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset password</a></p>
```

## Step 7: Setup Row Level Security (RLS)

All tables should have RLS enabled. Verify:

1. Go to **Table Editor**
2. For each table, click table name → **RLS Policies**
3. Verify **Enable RLS** is checked
4. Verify policies exist

If policies are missing, run from SQL Editor:

```sql
-- See DATABASE_SCHEMA.md for complete RLS policies
-- Example for stations table:

CREATE POLICY "Users can view own stations" ON public.stations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stations" ON public.stations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stations" ON public.stations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own stations" ON public.stations
  FOR DELETE USING (auth.uid() = user_id);
```

## Step 8: Create Database Helper Functions

Create file: `src/lib/db/stations.ts`

```ts
import { createServerClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type Station = Database['public']['Tables']['stations']['Row']
type StationInsert = Database['public']['Tables']['stations']['Insert']
type StationUpdate = Database['public']['Tables']['stations']['Update']

export async function createStation(station: StationInsert) {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('stations')
    .insert(station)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getStationById(stationId: string) {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('stations')
    .select('*')
    .eq('id', stationId)
    .single()

  if (error) throw error
  return data
}

export async function getStationBySlug(slug: string) {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('stations')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) throw error
  return data
}

export async function getUserStations(userId: string) {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('stations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function updateStation(stationId: string, updates: StationUpdate) {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('stations')
    .update(updates)
    .eq('id', stationId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteStation(stationId: string) {
  const supabase = createServerClient()

  const { error } = await supabase
    .from('stations')
    .delete()
    .eq('id', stationId)

  if (error) throw error
}
```

## Step 9: Test Database Connection

Create file: `src/app/api/test-db/route.ts`

```ts
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createServerClient()

    // Test connection
    const { error } = await supabase
      .from('stations')
      .select('id', { count: 'exact', head: true })

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}
```

Test it:

```bash
# Start dev server
pnpm dev

# In another terminal
curl http://localhost:3000/api/test-db
```

Expected response:

```json
{
  "success": true,
  "message": "Database connection successful",
  "timestamp": "2026-02-14T04:37:00.000Z"
}
```

## Step 10: Setup Database Monitoring

### 10.1: Enable Realtime

Go to **Database → Replication** and enable replication for these tables:

- `stations`
- `tracks`
- `playlists`
- `broadcast_history`
- `notifications`

### 10.2: Setup `pg_cron` (Optional)

For scheduled tasks, enable `pg_cron` extension:

```sql
-- Run in SQL Editor
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

Then add scheduled tasks (see `DATABASE_SCHEMA.md`).

## Step 11: Create Database Backup

### 11.1: Manual Backup

1. Go to **Database → Backups**
2. Click **Create Backup**
3. Name: `initial-schema`

### 11.2: Setup Automated Backups

1. Go to **Database → Backups → Settings**
2. Enable daily backups
3. Retention: 7 days (free tier)

## Step 12: Verify Installation

Create file: `scripts/verify-database.ts`

```ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyDatabase() {
  console.log('🔍 Verifying database setup...\n')

  // Check tables
  const tables = [
    'profiles',
    'stations',
    'tracks',
    'playlists',
    'playlist_tracks',
    'broadcast_history',
    'ai_decisions',
    'stream_sessions',
    'analytics_events',
    'notifications',
  ]

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('count').limit(1)
      if (error) throw error
      console.log(`✅ Table '${table}' exists`)
    } catch (error) {
      console.error(`❌ Table '${table}' missing or inaccessible`)
    }
  }

  // Check storage buckets
  console.log('\n🗂️  Checking storage buckets...\n')

  const buckets = ['tracks', 'artwork', 'avatars']

  for (const bucket of buckets) {
    try {
      const { data, error } = await supabase.storage.getBucket(bucket)
      if (error) throw error
      console.log(`✅ Bucket '${bucket}' exists`)
    } catch (error) {
      console.error(`❌ Bucket '${bucket}' missing`)
    }
  }

  console.log('\n✨ Database verification complete!')
}

verifyDatabase()
```

Run it:

```bash
npx tsx --env-file .env.local scripts/verify-database.ts
```

## Troubleshooting

### Issue: RLS Policy Blocks Inserts

**Symptom**: Can't insert data even when authenticated.  
**Solution**: Check RLS policies allow the operation.

```sql
-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Temporarily disable RLS for testing (NOT for production)
ALTER TABLE your_table DISABLE ROW LEVEL SECURITY;
```

### Issue: Storage Upload Fails

**Symptom**: `403 Forbidden` on file upload.  
**Solution**:

- Check bucket policies in **Storage → Policies**
- Verify authentication token is valid
- Check file size limits

### Issue: Type Generation Fails

**Symptom**: `supabase gen types` command fails.  
**Solution**:

```bash
# Re-login
supabase login

# Re-link project
supabase link --project-ref your-project-ref

# Try again
supabase gen types typescript --project-id your-project-id
```

### Issue: Functions Not Working

**Symptom**: Triggers or functions not executing.  
**Solution**: Check function syntax in SQL Editor.

```sql
-- List all functions
SELECT * FROM pg_proc WHERE proname LIKE '%your_function%';

-- Test function manually
SELECT your_function_name(param1, param2);
```

## Verification Checklist

Before moving to Phase 2, verify:

- [ ] All 10 tables created successfully
- [ ] 3 storage buckets configured
- [ ] RLS policies enabled on all tables
- [ ] Storage policies configured
- [ ] TypeScript types generated
- [ ] Database test endpoint returns success
- [ ] Supabase client connects successfully
- [ ] Auth providers configured
- [ ] Email templates customized
- [ ] Backup created

## Next Steps

Proceed to `PHASE_2_AUTH.md` to implement the authentication system.
