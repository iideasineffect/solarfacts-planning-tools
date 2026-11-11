# SolarFacts.net — practical monetization roadmap

Prepared November 10, 2026. Verify all program terms again before applying or publishing.

## What SolarFacts does best

The site serves homeowners researching residential solar installation, batteries, and energy costs. Lead with useful education and transparent tools, not exaggerated savings claims or aggressive signup gates.

## Recommended order

### 1. Residential solar installer leads

**Solar.com affiliate program**: https://www.solar.com/affiliates/

- Advertises milestone payments for eligible U.S. installation leads up to $626 across the full ladder in certain locations; lower state tiers apply.
- Application and approval are required; only qualified milestones earn payouts. Program may change at any time.
- Once approved, put your exact assigned tracked HTTPS URL into `js/partners.js` under `installer`.
- Best placement: immediately after a homeowner finishes the estimator, accompanied by clear disclosure and a neutral CTA (e.g., “Compare written solar quotes”). Do not promise particular savings.

### 2. Solar equipment and backup products

**A1 SolarStore:** https://a1solarstore.com/affiliate-program/

- Advertises 6% commission on qualifying solar product orders, capped at $250 per transaction, with its own exclusions and verification.
- Best content: “What size solar panel system do I need?”, beginner inverter guide, home battery sizing, component comparison.

**Renogy:** https://www.renogy.com/pages/affiliate-program

- Affiliate program listed, with compensation determined by merchant and network. Contact the merchant for details.
- Best content: off-grid panels, RV solar, portable equipment and beginner battery guides.

Use only tracked links issued after your applications are approved. Generic company links do **not** generate commissions.

### 3. Display ads and sponsored content

After publishing original guides and achieving repeat organic traffic, consider a quality ad network or clearly labeled sponsorships. Keep the estimator usable without intrusive interstitials. Avoid claims such as “guaranteed solar savings” and verify sponsor claims.

### 4. Optional lead magnet / newsletter

The printable `checklist.html` is currently ungated. If you build an optional email newsletter later, connect a real email provider, seek explicit opt-in, explain data practices and comply with applicable email marketing and privacy laws. The current project does not collect personal details or send emails.

## Suggested long-tail topics to publish

- How much solar panel capacity fits a 500-square-foot usable roof?
- Solar battery backup: kWh versus kW explained
- Why solar may not eliminate every utility charge
- How export credits and net metering affect solar economics
- 2026 residential solar incentives after the federal credit change
- Questions to ask before signing a financed solar contract
- How to compare two installer estimates with different assumptions
- Grid-tied solar versus off-grid solar for beginners

## Conversion path

Organic search / educational content → a useful calculator → a transparent explanation of assumptions → a free checklist → an optional, clearly disclosed commercial comparison.

Monitor **actual** engagement, not just clicks: time spent on the estimator, completed estimates, click-through to product resources, and eventual qualified referrals. If analytics are added, update privacy disclosures and configure consent where required.

## Important disclosures and source links

- FTC on clear disclosure of affiliate/endorsement relationships: https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking
- IRS confirms former U.S. residential 30% clean energy credit ended for expenditures after Dec 31, 2025: https://www.irs.gov/credits-deductions/residential-clean-energy-credit
- DSIRE for up-to-date state/local incentives: https://dsireusa.org/
- PVWatts for location-specific energy production: https://pvwatts.nlr.gov/

## Alignerr portfolio considerations

This package is a **new replacement implementation**, not a copy of your original Bolt source. To create an authentic GitHub engineering project, first review the code and tests, deploy it, maintain it, and commit improvements that you can independently explain. Examples: improve input validation, add regional utility-tariff modeling, introduce browser tests, create a comparison feature, integrate accurate location solar data using a secure backend. Don't imply that you personally wrote all AI-generated code; explain your role in specifying, reviewing, testing and deploying it. Confirm Alignerr's rules about eligible project ownership and independent engineering experience.
