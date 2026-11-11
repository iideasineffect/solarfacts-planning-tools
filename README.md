# SolarFacts — independent solar education and planning tools

A complete, responsive static website for **SolarFacts.net**. Includes an educational solar production and savings calculator, battery backup runtime calculator, learning guides, a printable installer checklist, and a clearly labeled resource directory that can be monetized only after affiliate approval.

> Important: This is a **new replacement implementation** based on publicly visible site content and the requested redesign. It does not contain or preserve the original Bolt.new source code, assets, analytics, existing forms, or third-party integrations. Back up your current live site before deployment.

## Features

- Responsive, accessible landing page with original SVG artwork and SEO metadata.
- Transparent solar calculations (`js/estimator.js`): roof-limited panel count, annual energy, illustrative system cost, self-consumption and export savings, 25-year annual cash flow and modeled payback.
- Optional assumptions for equipment, rates, export value, maintenance, utility rate escalation and degradation.
- Client-side CSV export and print layout.
- Independent battery runtime tool.
- Learning guides, commercial/independent resources, printable buyer checklist and privacy notice.
- No website visitors' calculator inputs are uploaded, and no analytics trackers or mailing list forms ship in the project.
- Automated unit tests using Node's built-in test runner; no API tokens required.

## Run locally

Use a current Node.js LTS release (Node 22 recommended).

```bash
npm install
npm run dev
```

Visit the local address printed by Vite. To run test cases:

```bash
npm test
npm run build
```

The production files are plain HTML/CSS/JavaScript; they can also be uploaded directly to a static web host without running a build command. Alternatively, deploy the generated `dist/` directory from `npm run build`.

## GitHub upload

1. Create a new private repository named `solarfacts-planning-tools` under your account (don't overwrite your unrelated `ideasineffectrepository`).
2. Upload the **contents** of this project folder, preserving file names and subfolders. Alternatively, in a terminal:

```bash
git init
git add .
git commit -m "Build independent SolarFacts guides and planning tools"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/solarfacts-planning-tools.git
git push -u origin main
```

3. Review the code, run tests, and make your own incremental changes. Keep a commit history documenting meaningful work.
4. **For Alignerr:** uploading a project alone doesn't demonstrate Git, terminal, or independent debugging proficiency. Review the employer's current project eligibility and ownership rules before submitting anything.

## Publish to SolarFacts.net

Back up the existing site and DNS/hosting configuration first. Upload the site contents to the website's public web root (for example `public_html`) or the `dist/` output from `npm run build`. All page links are relative, so they also work under a GitHub Pages project path. Canonical URLs and sitemap are written for `solarfacts.net`.

**Before launch:** test on desktop and mobile, verify every external link, replace/verify the privacy notice for your actual hosting, and check the estimator's results against a professional location-specific model. The project doesn't collect leads or send email.

## How to enable partner referral links

`js/partners.js` contains `AFFILIATE_LINKS` with **blank strings** for three partner categories:

```js
export const AFFILIATE_LINKS = {
  installer: '', // Approved Solar.com tracked URL
  equipment: '', // Approved A1 SolarStore tracked URL
  offgrid: '',   // Approved Renogy tracked URL
};
```

Don't invent an affiliate URL or use the generic landing-page links expecting commissions. Apply to each company's program, confirm their terms, then add only your **approved** HTTPS tracking URLs and verify the affiliate disclosure on `resources.html` and `privacy.html`. For future signup forms, use a real provider with explicit consent; no backend or lead database is part of this build.

## Calculation methodology

See `js/estimator.js` and `tests/estimator.test.mjs`. The calculations are illustrative and intentionally simple:

- `monthly kWh ≈ monthly bill / retail rate`. This is not precise where fixed charges, time-of-use pricing and tiered rates apply.
- `kWh/year/kW ≈ peak sun hours/day × 365 × performance ratio`.
- `desired capacity = annual estimated usage × offset target / kWh/year/kW`.
- `panels = min(ceil(desired kW×1000 / panel watts), floor(usable roof ft² / panel footprint ft²))`.
- `yearly gross value = self-consumed kWh × retail price + exported kWh × export price`.
- `yearly net savings = max(0, gross value - entered annual maintenance)`; future years apply growth and degradation assumptions.
- Gross installed system cost = nominal installed W × entered $/W, before any incentives.
- Battery runtime in hours = `capacity kWh × usable fraction × 1000 / constant load watts`.

This does **not** predict site-specific weather, roof angle, shading, detailed bill tariffs, inverter clipping, financing, permitting, taxes, interest, degradation-specific production changes beyond the model, or replacement expenses. No federal tax credit is applied. Values are illustrative editable defaults, not claims about national averages.

Official research resources:
- [PVWatts](https://pvwatts.nlr.gov/)
- [DSIRE incentives database](https://dsireusa.org/)
- [IRS residential clean energy credit](https://www.irs.gov/credits-deductions/residential-clean-energy-credit)
- [FTC affiliate disclosure guidance](https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking)

## Production / next version ideas

- Replace simplifying sunlight input with accurate location-based PVWatts API integration using a securely hosted backend, not an exposed API key.
- Add regional utility rate lookup, state-specific export compensation and time-of-use savings calculations.
- Add accessibility testing, browser end-to-end tests, CI and more project history.
- Add comparative installer proposals and user-controlled print/PDF reports.
- Create an opt-in checklist delivery flow with consent and privacy compliance.

## Disclosure

Educational estimates only. Not engineering, electrical, tax or financial advice. This project is not affiliated with any solar equipment brand, retailer, utility, the IRS, or the National Lab of the Rockies.
