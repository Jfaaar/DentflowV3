-- =============================================================
-- 0003_rls_policies.sql — Tenant-scoped RLS policies for
-- patients, appointments, invoices, payments, documents,
-- notifications, and notification_templates.
-- =============================================================

-- Helper: clinic_id of the calling user
CREATE OR REPLACE FUNCTION public.current_clinic_id()
RETURNS UUID LANGUAGE SQL STABLE AS $$
  SELECT clinic_id FROM profiles WHERE id = auth.uid()
$$;

-- Patients ----------------------------------------------------
DROP POLICY IF EXISTS patients_tenant ON patients;
CREATE POLICY patients_tenant ON patients
  FOR ALL USING (clinic_id = public.current_clinic_id())
  WITH CHECK (clinic_id = public.current_clinic_id());

-- Appointments / invoices / payments -------------------------
DROP POLICY IF EXISTS appointments_tenant ON appointments;
CREATE POLICY appointments_tenant ON appointments
  FOR ALL USING (clinic_id = public.current_clinic_id())
  WITH CHECK (clinic_id = public.current_clinic_id());

DROP POLICY IF EXISTS invoices_tenant ON invoices;
CREATE POLICY invoices_tenant ON invoices
  FOR ALL USING (clinic_id = public.current_clinic_id())
  WITH CHECK (clinic_id = public.current_clinic_id());

DROP POLICY IF EXISTS payments_tenant ON payments;
CREATE POLICY payments_tenant ON payments
  FOR ALL USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE clinic_id = public.current_clinic_id()
    )
  );

-- Documents --------------------------------------------------
DROP POLICY IF EXISTS documents_tenant ON documents;
CREATE POLICY documents_tenant ON documents
  FOR ALL USING (clinic_id = public.current_clinic_id())
  WITH CHECK (clinic_id = public.current_clinic_id());

-- Notifications ----------------------------------------------
DROP POLICY IF EXISTS notifications_tenant_select ON notifications;
CREATE POLICY notifications_tenant_select ON notifications
  FOR SELECT USING (
    recipient_user_id = auth.uid()
    OR clinic_id = public.current_clinic_id()
  );

DROP POLICY IF EXISTS notifications_tenant_write ON notifications;
CREATE POLICY notifications_tenant_write ON notifications
  FOR INSERT WITH CHECK (clinic_id = public.current_clinic_id());

-- Templates: world-readable, no writes from client
DROP POLICY IF EXISTS notification_templates_read ON notification_templates;
CREATE POLICY notification_templates_read ON notification_templates
  FOR SELECT USING (true);
