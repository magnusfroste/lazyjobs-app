# Migration: File-based State → Supabase Table

## 🎯 Varför?

**Tidigare:** Connector state sparades i en JSON-fil (`/app/connector-state/.connector-state.json`)

**Problem:**
- ❌ Försvinner vid container restart
- ❌ Fungerar inte i serverless/ephemeral containers
- ❌ Svårt att debugga
- ❌ Ingen historik
- ❌ Kan inte se state från flera connectors

**Nu:** State sparas i Supabase `connector_state` tabell

**Fördelar:**
- ✅ Persistent storage
- ✅ Fungerar överallt (serverless, containers, etc)
- ✅ Lätt att debugga via Supabase dashboard
- ✅ Full historik med timestamps
- ✅ Centraliserad state för alla connectors
- ✅ Kan spåra success/failure, stats, errors

## 📋 Steg för att migrera

### 1. Kör SQL-migrationen i LazyJobs Supabase

```bash
# Öppna Supabase dashboard för LazyJobs
# Gå till SQL Editor
# Kör innehållet i migration-connector-state.sql
```

Eller via CLI:
```bash
supabase db push --db-url "postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres" < migration-connector-state.sql
```

### 2. Verifiera att tabellen skapades

```sql
SELECT * FROM connector_state;
```

Du bör se en rad för 'openjobs' connector med `last_sync_time` satt till 7 dagar sedan.

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

### Läsa state (före sync)

```javascript
const lastSync = await getLastSyncTime()
// Hämtar från: SELECT last_sync_time FROM connector_state WHERE connector_name='openjobs'
```

### Spara state (efter sync)

```javascript
await saveLastSyncTime(new Date().toISOString(), {
  success: true,
  jobs_fetched: 40,
  jobs_ingested: 35,
  metadata: { processed: 40, updated: 5, skipped: 0 }
})
// Anropar: update_connector_state() function
```

### Spara error state (vid fel)

```javascript
await saveLastSyncTime(new Date().toISOString(), {
  success: false,
  error_message: "OpenJobs API error: 500",
  metadata: { error_stack: "..." }
})
```

## 📊 Övervaka state

### Via Supabase Dashboard

```sql
-- Se senaste sync
SELECT 
  connector_name,
  last_sync_time,
  last_sync_success,
  jobs_fetched,
  jobs_ingested,
  error_message,
  updated_at
FROM connector_state
ORDER BY updated_at DESC;
```

### Se historik (om du vill spara historik)

Du kan enkelt lägga till en `connector_state_history` tabell:

```sql
CREATE TABLE connector_state_history AS SELECT * FROM connector_state WHERE false;
ALTER TABLE connector_state_history ADD COLUMN id SERIAL PRIMARY KEY;

-- Trigger för att spara historik
CREATE OR REPLACE FUNCTION save_connector_state_history()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO connector_state_history 
  SELECT * FROM connector_state WHERE connector_name = NEW.connector_name;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER connector_state_history_trigger
AFTER UPDATE ON connector_state
FOR EACH ROW
EXECUTE FUNCTION save_connector_state_history();
```

## 🚀 Fördelar

1. **Reliability:** State försvinner aldrig
2. **Debugging:** Se exakt när och varför syncs misslyckades
3. **Monitoring:** Spåra success rate, antal jobb, etc
4. **Scalability:** Fungerar med flera connector-instanser
5. **Simplicity:** Ingen volume mount att hantera

## 🔄 Rollback (om något går fel)

Om du behöver gå tillbaka till fil-baserad state:

1. Återställ gamla koden från git
2. Lägg tillbaka `STATE_FILE` env variable
3. Lägg tillbaka volume mount

Men det borde inte behövas - Supabase-lösningen är mycket mer robust! 🎉
