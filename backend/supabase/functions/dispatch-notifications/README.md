# dispatch-notifications

Edge Function that drains the `notifications` queue every minute. See
ARCHITECTURE.md §3.7 for the design.

## What it does

1. Selects up to 50 rows from `notifications` where
   `status = 'queued'` and `scheduled_for <= now()`.
2. Resolves a `notification_templates` row by `(key, channel, locale)`,
   falling back to `locale = 'en'` if the requested locale is missing.
3. Renders the template body with `{{ var }}` placeholders filled from
   `notifications.payload`.
4. **Stubs delivery** by logging a single line per notification. Replace
   the `deliverStub(...)` call with a real provider integration in a
   later phase.
5. Marks each row `status = 'sent'` (or `failed` with a message in
   `error`) and stamps `sent_at`.

## Local dev

```sh
supabase functions serve dispatch-notifications --env-file .env
# then trigger manually:
curl -X POST http://localhost:54321/functions/v1/dispatch-notifications \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"
```

## Deploy

```sh
supabase functions deploy dispatch-notifications --schedule "* * * * *"
```

The `--schedule` flag registers a cron trigger in Supabase's scheduler
(every minute). Adjust the cron expression if you want a coarser
cadence — for example `"*/5 * * * *"` for every 5 minutes.

## Env

The function relies on the standard Edge Function environment:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Both are injected automatically by Supabase when the function is
deployed; locally they must be in the `.env` file you pass to
`supabase functions serve`.

## Files

- `index.ts` — the cron handler.
- `../_shared/supabase.ts` — shared service-role client.
