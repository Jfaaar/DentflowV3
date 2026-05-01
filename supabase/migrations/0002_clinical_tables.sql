-- =============================================================
-- 0002_clinical_tables.sql — Patients, treatments, appointments,
-- invoices, payments, prescriptions, documents, notifications.
-- Phase 3 services in lib/services rely on the documents and
-- notifications tables defined here.
-- =============================================================

-- Patients ----------------------------------------------------
CREATE TABLE IF NOT EXISTS patients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id   UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  phone       TEXT,
  email       TEXT,
  birth_date  DATE,
  gender      TEXT CHECK (gender IN ('male', 'female')),
  address     TEXT,
  insurance_provider TEXT,
  medical_history JSONB DEFAULT '{}'::jsonb,
  status      TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments ------------------------------------------------
CREATE TABLE IF NOT EXISTS appointments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id   UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id  UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  start_at    TIMESTAMPTZ NOT NULL,
  end_at      TIMESTAMPTZ NOT NULL,
  status      TEXT DEFAULT 'pending'
    CHECK (status IN ('confirmed', 'pending', 'canceled', 'completed')),
  observation TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices / payments ----------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id     UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id    UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  amount        NUMERIC(10,2) NOT NULL,
  paid_amount   NUMERIC(10,2) DEFAULT 0,
  status        TEXT DEFAULT 'unpaid'
    CHECK (status IN ('paid', 'unpaid', 'partial')),
  issued_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount      NUMERIC(10,2) NOT NULL,
  method      TEXT CHECK (method IN ('cash', 'card', 'transfer', 'check')),
  paid_at     TIMESTAMPTZ DEFAULT NOW(),
  note        TEXT
);

-- Documents (storage metadata) -------------------------------
CREATE TABLE IF NOT EXISTS documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id    UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id   UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name    TEXT NOT NULL,
  mime_type    TEXT,
  size_bytes   BIGINT,
  category     TEXT NOT NULL DEFAULT 'other'
    CHECK (category IN ('radiology', 'consent', 'insurance', 'certificate', 'other')),
  uploaded_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at  TIMESTAMPTZ DEFAULT NOW(),
  archived_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_documents_patient   ON documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_documents_clinic    ON documents(clinic_id);
CREATE INDEX IF NOT EXISTS idx_documents_category  ON documents(category);

-- Notification templates -------------------------------------
CREATE TABLE IF NOT EXISTS notification_templates (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key       TEXT NOT NULL,
  locale    TEXT NOT NULL DEFAULT 'en',
  channel   TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp', 'push')),
  subject   TEXT,
  body      TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (key, locale, channel)
);

-- Notifications queue ----------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id         UUID REFERENCES clinics(id) ON DELETE CASCADE,
  recipient_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id        UUID REFERENCES patients(id) ON DELETE CASCADE,
  channel           TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp', 'push')),
  template_key      TEXT NOT NULL,
  payload           JSONB DEFAULT '{}'::jsonb,
  status            TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'sent', 'failed', 'cancelled')),
  scheduled_for     TIMESTAMPTZ DEFAULT NOW(),
  sent_at           TIMESTAMPTZ,
  error             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_status_schedule
  ON notifications(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient
  ON notifications(recipient_user_id);

ALTER TABLE patients              ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices              ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents             ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications         ENABLE ROW LEVEL SECURITY;
