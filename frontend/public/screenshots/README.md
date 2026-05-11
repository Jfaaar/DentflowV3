# Landing page screenshots

The landing page references these files. Save the screenshots from the product
into this folder using the exact filenames below. PNG or JPG both work — the
landing page uses them as `<img src="/screenshots/<name>" />`.

## Required

| File                          | Source view in the app                     |
| ----------------------------- | ------------------------------------------ |
| `dashboard.png`               | Tableau de bord (clinic admin)             |
| `calendar-month.png`          | Emploi du temps — Mois                     |
| `calendar-day.png`            | Emploi du temps — Jour                     |
| `appointment-modal.png`       | Nouveau RDV modal                          |
| `patients.png`                | Annuaire Patients                          |
| `patient-overview.png`        | Patient detail — Vue d'ensemble            |
| `patient-vitals.png`          | Patient detail — Constantes                |
| `patient-prescriptions.png`   | Patient detail — Ordonnances               |
| `patient-billing.png`         | Patient detail — Facturation               |
| `prescription-modal.png`      | Créer Ordonnance modal                     |
| `prescription-print.png`      | Prescription print preview                 |
| `stock.png`                   | Stock (inventory) page                     |
| `invoices.png`                | Factures page                              |

## Tips

- **Crop tightly** — landing-page browser frames are ~16:10 ratio; full-page
  screenshots with lots of empty whitespace will look pinched.
- **Light mode** — the screenshots embed inside light browser chrome. Capture
  the app in light mode for visual consistency.
- **Same viewport** — capture at ~1440×900 or 1600×1000 so all screenshots
  look like they're from the same browser window.
- **Optimize** — run through `pngquant` or `tinypng.com` before committing;
  unoptimized screenshots will tank the landing-page LCP score.
