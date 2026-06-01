-- Track security-relevant events: failed logins, lockouts, admin access, csrf blocks.
CREATE TABLE IF NOT EXISTS security_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  TEXT NOT NULL,
  user_id     UUID,
  user_email  TEXT,
  ip          TEXT,
  user_agent  TEXT,
  path        TEXT,
  details     JSONB,
  severity    TEXT DEFAULT 'info',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sec_events_created_at ON security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sec_events_event_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_sec_events_ip         ON security_events(ip);
CREATE INDEX IF NOT EXISTS idx_sec_events_user       ON security_events(user_id);

ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Only service-role can read/write security events. Default policies block anon/auth.
DROP POLICY IF EXISTS "security_events service role" ON security_events;
CREATE POLICY "security_events service role" ON security_events
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
