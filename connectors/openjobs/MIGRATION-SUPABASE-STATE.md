# Migration: File-based State → Supabase History Table

## 🎯 Varför?

**Tidigare:** Connector state sparades i en JSON-fil (`/app/connector-state/.connector-state.json`)

**Problem:**
- ❌ Försvinner vid container restart
- ❌ Fungerar inte i serverless/ephemeral containers
- ❌ Svårt att debugga
- ❌ Ingen historik
- ❌ Kan inte se state från flera connectors

**Nu:** Sync history sparas i Supabase `connector_sync_history` tabell

**Fördelar:**
- ✅ Persistent storage
- ✅ Fungerar överallt (serverless, containers, etc)
- ✅ Lätt att debugga via Supabase dashboard
- ✅ Full historik med timestamps
- ✅ Centraliserad state för alla connectors
- ✅ Kan spåra success/failure, stats, errors

## 📋 Steg för att migrera

### 1. Kör SQL-migrationen i LazyJobs Supabase

**Använd den nya history-baserade migrationen:**

```bash
# Öppna Supabase dashboard för LazyJobs
# Gå till SQL Editor
# Kör innehållet i migration-connector-sync-history.sql
```

Eller via CLI:
```bash
supabase db push --db-url "postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres" < migration-connector-sync-history.sql
```

### 2. Verifiera att tabellen skapades

```sql
-- Se alla sync records
SELECT * FROM connector_sync_history ORDER BY sync_time DESC;

-- Se senaste sync per connector
SELECT * FROM connector_latest_sync;
```

Du bör se en initial rad för 'openjobs' connector med `sync_time` satt till 7 dagar sedan.

### 3. Deploy uppdaterad connector

```bash
cd /Users/mafr/Code/github/openlazyjobs/lazyjobs-lovable/connectors/openjobs
docker build -t lazyjobs-openjobs-connector:latest .
# Deploy till din platform
```

### 4. Ta bort gamla environment variables

Du behöver **INTE** längre:
```bash
STATE_FILE=/app/connector-state/.connector-state.json  # ❌ Ta bort
```

Du behöver fortfarande:
```bash
INGEST_URL=https://arqugyvmegxonaerjbzd.supabase.co/functions/v1/ingest-jobs
SUPABASE_ANON_KEY=your-anon-key
```

### 5. Ta bort volume mount (om du har det)

I din Docker Compose eller container config, ta bort:
```yaml
volumes:
  - connector-state:/app/connector-state  # ❌ Behövs inte längre
```

## 🔍 Hur det fungerar

### Läsa senaste sync (före sync)

**Enkel REST GET:**
```javascript
const lastSync = await getLastSyncTime()
// GET /rest/v1/connector_sync_history?connector_name=eq.openjobs&select=sync_time&order=sync_time.desc&limit=1
// Returnerar: [{ sync_time: "2025-11-19T15:00:00Z" }]
```

### Spara ny sync record (efter sync)

**Enkel REST POST:**
```javascript
await saveLastSyncTime(new Date().toISOString(), {
  success: true,
  jobs_fetched: 40,
  jobs_ingested: 35,
  metadata: { processed: 40, updated: 5, skipped: 0 }
})
// POST /rest/v1/connector_sync_history
// Body: { connector_name: "openjobs", sync_time: "...", success: true, ... }
// Lägger till NY rad i tabellen
```

### Spara error state (vid fel)

**Samma POST, men med error:**
```javascript
await saveLastSyncTime(new Date().toISOString(), {
  success: false,
  error_message: "OpenJobs API error: 500",
  metadata: { error_stack: "..." }
})
// POST /rest/v1/connector_sync_history
// Body: { connector_name: "openjobs", success: false, error_message: "...", ... }
```

**Varje sync = ny rad i tabellen!** 📊

## 📊 Övervaka sync history

### Via Supabase Dashboard

```sql
-- Se senaste 10 syncs
SELECT 
  connector_name,
  sync_time,
  success,
  jobs_fetched,
  jobs_ingested,
  error_message,
  created_at
FROM connector_sync_history
ORDER BY sync_time DESC
LIMIT 10;

-- Se senaste sync per connector (via view)
SELECT * FROM connector_latest_sync;

-- Räkna success rate
SELECT 
  connector_name,
  COUNT(*) as total_syncs,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful,
  ROUND(100.0 * SUM(CASE WHEN success THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate_pct
FROM connector_sync_history
GROUP BY connector_name;

-- Se genomsnittligt antal jobb per sync
SELECT 
  connector_name,
  AVG(jobs_fetched) as avg_fetched,
  AVG(jobs_ingested) as avg_ingested
FROM connector_sync_history
WHERE success = true
GROUP BY connector_name;
```

### Full historik finns redan!

Ingen extra tabell behövs - `connector_sync_history` **ÄR** historiken!

Varje sync lägger till en ny rad, så du kan:
- Se trends över tid
- Identifiera när problem började
- Räkna success rate
- Analysera performance

## 🚀 Fördelar med History-baserad approach

1. **Reliability:** State försvinner aldrig
2. **Full historik:** Se ALLA syncs, inte bara senaste
3. **Debugging:** Spåra när problem började, se trends
4. **Analytics:** Success rate, genomsnitt, performance över tid
5. **Simplicity:** 
   - Enkel REST POST (ingen RPC)
   - Ingen UPSERT-logik
   - Bara INSERT för varje sync
6. **Scalability:** Fungerar med flera connector-instanser
7. **No volume mounts:** Ingen fil-hantering alls

## 🔄 Rollback (om något går fel)

Om du behöver gå tillbaka till fil-baserad state:

1. Återställ gamla koden från git
2. Lägg tillbaka `STATE_FILE` env variable
3. Lägg tillbaka volume mount

Men det borde inte behövas - Supabase-lösningen är mycket mer robust! 🎉
