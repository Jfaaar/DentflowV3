-- ============================================
-- 0005_invoice_status_trigger.sql
-- Auto-recompute invoice paid_amount + status whenever a payment is
-- inserted / updated / deleted. Implements ARCHITECTURE.md §3.4.
-- Idempotent.
-- ============================================

CREATE OR REPLACE FUNCTION recompute_invoice_status() RETURNS TRIGGER AS $$
DECLARE
  target_id UUID;
  total_paid NUMERIC(12,2);
BEGIN
  -- DELETE rows have no NEW; pull the invoice id from OLD instead.
  IF TG_OP = 'DELETE' THEN
    target_id := OLD.invoice_id;
  ELSE
    target_id := NEW.invoice_id;
  END IF;

  IF target_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT COALESCE(SUM(amount), 0)
    INTO total_paid
    FROM payments
   WHERE invoice_id = target_id
     AND NOT refunded;

  UPDATE invoices
     SET paid_amount = total_paid,
         status = CASE
           WHEN total_paid >= amount AND amount > 0 THEN 'paid'::invoice_status
           WHEN total_paid > 0 THEN 'partial'::invoice_status
           WHEN due_at IS NOT NULL AND due_at < NOW() THEN 'overdue'::invoice_status
           ELSE 'unpaid'::invoice_status
         END
   WHERE id = target_id;

  RETURN COALESCE(NEW, OLD);
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payments_recompute_invoice ON payments;

CREATE TRIGGER trg_payments_recompute_invoice
AFTER INSERT OR UPDATE OR DELETE ON payments
FOR EACH ROW EXECUTE FUNCTION recompute_invoice_status();
