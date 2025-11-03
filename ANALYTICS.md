# Analytics Integration

This game uses a privacy-first anonymous analytics system to track gameplay events and user engagement.

## Configuration

Analytics are configured via environment variables in `.env.local`:

```env
VITE_ANALYTICS_ENDPOINT=https://jqpaorlkzjoubggzwpqx.supabase.co/functions/v1/analytics
VITE_APP_NAME=astro-blitz
VITE_ANALYTICS_DEBUG=true
```

Set `VITE_ANALYTICS_DEBUG=false` in production to disable debug logging.

## Tracked Events

### Game Lifecycle
- **game_loaded** - When the game page loads
- **game_start** - When the player starts playing
- **game_over** - When the player dies (includes score, wave, duration, stats)

### Gameplay Events
- **wave_start** - When a new wave begins (tracks if it's a boss wave)
- **wave_complete** - When a wave is completed (includes time taken)
- **boss_defeated** - When a boss enemy is defeated
- **enemies_milestone** - Every 10 enemies killed
- **high_score** - When a new high score is achieved

### Player Actions
- **powerup_collected** - When a power-up is collected (type: rapidfire/shield/bomb/missiles)
- **missile_fired** - When a missile is launched
- Bullet shots are tracked internally but not sent to analytics (too frequent)

### Session Metrics
All game_over events include:
- Final score
- Wave reached
- Session duration
- Total enemies killed
- Total bullets shot
- Total missiles used
- Total power-ups collected
- Accuracy percentage

## Privacy

The analytics system is designed with privacy in mind:
- ✅ Anonymous IDs (no personal information)
- ✅ Session tracking (temporary session IDs)
- ✅ Automatic PII sanitization
- ✅ No IP address storage
- ✅ Only country-level location (not city/precise location)
- ✅ Device type only (not fingerprinting)

## Backend Setup

To use analytics, you need:

1. **Supabase Backend**: Deploy the analytics backend with `./deploy.sh`
2. **Application Registration**: Register the app in the database:
   ```sql
   INSERT INTO applications (name, description, domain)
   VALUES ('astro-blitz', 'Astro Blitz Space Shooter Game', 'yourapp.com');
   ```

## Viewing Analytics Data

Query your analytics in Supabase:

```sql
-- Daily active users
SELECT
  DATE(created_at) as date,
  COUNT(DISTINCT anonymous_id) as users
FROM analytics_events
WHERE application_id = (SELECT id FROM applications WHERE name = 'astro-blitz')
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date;

-- Most common final waves
SELECT
  properties->>'wave' as final_wave,
  COUNT(*) as count,
  AVG((properties->>'score')::int) as avg_score
FROM analytics_events
WHERE event_name = 'game_over'
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY properties->>'wave'
ORDER BY count DESC;

-- Power-up popularity
SELECT
  properties->>'type' as powerup_type,
  COUNT(*) as collected
FROM analytics_events
WHERE event_name = 'powerup_collected'
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY properties->>'type'
ORDER BY collected DESC;

-- Boss defeat rates
SELECT
  properties->>'boss_type' as boss_type,
  COUNT(*) as defeats,
  AVG((properties->>'time')::int) as avg_time
FROM analytics_events
WHERE event_name = 'boss_defeated'
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY properties->>'boss_type'
ORDER BY defeats DESC;
```

## Development

In development mode (`VITE_ANALYTICS_DEBUG=true`), all analytics events are logged to the browser console for debugging.

## Architecture

- **Client**: `src/lib/analytics.ts` - Core analytics client library
- **Manager**: `src/game/AnalyticsManager.ts` - Game-specific analytics wrapper
- **Integration**: Events tracked throughout `src/game/Game.ts`
- **Initialization**: Analytics singleton initialized in `src/main.ts`

## Testing

To test analytics integration:

1. Set `VITE_ANALYTICS_DEBUG=true` in `.env.local`
2. Run `npm run dev`
3. Play the game and watch the browser console for analytics events
4. Check the Supabase database for received events:
   ```sql
   SELECT * FROM analytics_events
   WHERE application_id = (SELECT id FROM applications WHERE name = 'astro-blitz')
   ORDER BY created_at DESC
   LIMIT 10;
   ```

## Disabling Analytics

To disable analytics entirely, set:
```env
VITE_ANALYTICS_DEBUG=false
```

And modify `src/game/AnalyticsManager.ts`:
```typescript
disabled: true  // Set to true to disable
```
