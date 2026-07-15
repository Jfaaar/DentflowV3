# Landing page screenshots

These are **real screenshots of the running app**, captured automatically. Don't
hand-edit them or drop in manually-taken replacements — the set would drift out
of sync (mismatched viewports, themes, cursor artifacts).

The landing page consumes them through `<Screenshot name="…" />`
([src/features/landing/Screenshot.tsx](../../src/features/landing/Screenshot.tsx)),
which ships a `-light` / `-dark` pair per view and lets CSS pick.

## Re-capturing

After a UI change that shows up on the landing page:

```bash
docker compose up -d
npm run dev

# Load the showcase clinic — a busy practice, dated relative to today.
docker exec -i dentflow-postgres psql -U dentflow -d dentflow \
  < backend/db/init/99e_showcase_seed.sql

npm run screenshots
```

`npm run screenshots` drives Chrome through the real app: it logs in with the
dev bypass, forces French, walks each view (clicking into the patient record,
opening the booking modal, building an Rx), parks the cursor off-canvas so no
hover tooltips leak in, and writes both themes.

## The set

| Name                 | View                         | Used by                     |
| -------------------- | ---------------------------- | --------------------------- |
| `dashboard`          | Tableau de bord              | hero + Product showcase     |
| `calendar-month`     | Emploi du temps — Mois       | Product showcase            |
| `patient-overview`   | Patient — Vue d'ensemble     | Product showcase            |
| `stock`              | Stock                        | Product showcase            |
| `invoices`           | Factures                     | Product showcase            |
| `prescription-modal` | Nouvelle ordonnance (filled) | Product showcase + Workflow |
| `appointment-modal`  | Nouveau RDV                  | Workflow — 01 Book          |
| `patient-vitals`     | Patient — Constantes         | Workflow — 02 See           |
| `patient-billing`    | Patient — Facturation        | Workflow — 04 Bill          |

Each exists as `<name>-light.png` and `<name>-dark.png`.

## Why the seed matters

Straight off the dev seed the clinic is empty — 0 DH revenue, no agenda, three
patients — and the screenshots make the product look dead.
`backend/db/init/99e_showcase_seed.sql` fills it with a believable practice
(~50 patients, a full day's agenda, ten weeks of invoices, two lines running low
on stock) and dates everything relative to `CURRENT_DATE`, so re-running it
always produces a clinic that looks live *today*.
