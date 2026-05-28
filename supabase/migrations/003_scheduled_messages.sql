-- Scheduled messages: add scheduling columns, status, dispatcher cron.

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'sent'
    CHECK (status IN ('scheduled', 'sending', 'sent', 'failed', 'cancelled'));

CREATE INDEX IF NOT EXISTS messages_due_idx
  ON public.messages (status, scheduled_at)
  WHERE status = 'scheduled';

-- Allow org users to insert scheduled messages (status='scheduled' only) and
-- cancel them. Immediate sends still go through edge functions with service role.
CREATE POLICY "org members can insert scheduled messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    org_id = public.get_my_org_id()
    AND status = 'scheduled'
    AND scheduled_at IS NOT NULL
    AND sent_by = auth.uid()
  );

CREATE POLICY "org members can cancel their scheduled messages"
  ON public.messages FOR UPDATE
  USING (
    org_id = public.get_my_org_id()
    AND status = 'scheduled'
  )
  WITH CHECK (
    org_id = public.get_my_org_id()
    AND status IN ('scheduled', 'cancelled')
  );

-- Extensions for cron-driven dispatch
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Secrets live in Supabase Vault. Before deploying, insert them via SQL editor:
--   SELECT vault.create_secret('https://<project-ref>.supabase.co', 'supabase_url');
--   SELECT vault.create_secret('<service-role-key>', 'service_role_key');

CREATE OR REPLACE FUNCTION public.dispatch_scheduled_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  msg record;
  fn_url text;
  service_key text;
BEGIN
  SELECT decrypted_secret INTO fn_url
    FROM vault.decrypted_secrets WHERE name = 'supabase_url' LIMIT 1;
  SELECT decrypted_secret INTO service_key
    FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1;

  IF fn_url IS NULL OR service_key IS NULL THEN
    RAISE WARNING 'dispatch_scheduled_messages: supabase_url or service_role_key not in vault';
    RETURN;
  END IF;

  FOR msg IN
    UPDATE public.messages
       SET status = 'sending'
     WHERE id IN (
       SELECT id FROM public.messages
        WHERE status = 'scheduled'
          AND scheduled_at <= now()
        ORDER BY scheduled_at
        LIMIT 50
        FOR UPDATE SKIP LOCKED
     )
    RETURNING id, scope
  LOOP
    PERFORM net.http_post(
      url := fn_url || '/functions/v1/' ||
             CASE WHEN msg.scope = 'stake_all' THEN 'send-stake-blast' ELSE 'send-sms' END,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_key
      ),
      body := jsonb_build_object('message_id', msg.id)
    );
  END LOOP;
END;
$$;

-- Schedule dispatcher every minute
SELECT cron.schedule(
  'dispatch-scheduled-messages',
  '* * * * *',
  $$ SELECT public.dispatch_scheduled_messages(); $$
);
