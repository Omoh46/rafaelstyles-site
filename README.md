# Rafael Styles — Storefront

Static HTML/CSS/JS marketing site for **Rafael Styles** (mobile luxury hair blowouts, Chicagoland + North Shore). No backend, no build step — plain files, deployable anywhere that serves static assets.

## Structure

```
index.html      Home — emblem-fade hero, verbatim hero copy, About/The Artist section
lookbook.html   Lookbook Menu — accordion service cards with parallax texture, 3 categories
policies.html   Policies & Covenant — the single, verbatim copy of the public policy text
css/styles.css  Design system (black #000000 / gold #D4AF37)
js/main.js      Nav toggle, emblem-gate dismissal, accessible accordion, parallax scroll
assets/         logo_emblem.png + generated favicons
```

## Content rules baked into this build

- **No prices or durations anywhere.** Pricing lives exclusively in GlossGenius.
- All "Reserve" links point to `https://rafaelstyles.glossgenius.com` (outbound only — no GlossGenius config here).
- The Section 3.5 policy covenant appears **once**, in full, on `policies.html`. The footer on every page only links to it.
- Hero and About copy are reproduced verbatim from the build brief.

## Placeholder photography

Real photography (lookbook service images, hero lifestyle photo, artist portrait) has not been delivered yet. Every slot is a clearly labeled placeholder (`.placeholder-slot`) sized at the correct aspect ratio, so dropping in real images later is a straight swap:

- Hero lifestyle photo — 4:5 (mobile falls back to 16:10)
- About portrait — 3:4
- Lookbook service cards — 4:5, one per service/add-on/companion listing

To swap: replace the `.placeholder-slot` `<div>` with an `<img>` tag using the same class names for spacing, or add `background-image` to the slot.

## Local preview

No build step required. From this directory:

```
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

## Deployment (GitHub Pages)

This repo is deployed to GitHub Pages from the `main` branch, `/` (root).

Live URL: **https://omoh46.github.io/rafaelstyles-site/**

## Connecting the custom domain (rafaelstyles.com) — do this once GoDaddy Delegate Access arrives

This part cannot be automated from here — it requires someone with delegate access to log into GoDaddy's DNS manager in a browser. Steps, once access is granted:

1. **In GoDaddy DNS Manager** for `rafaelstyles.com`, add these records:
   - **A records** (apex domain `rafaelstyles.com`) pointing to GitHub Pages' IPs:
     - `185.199.108.153`
     - `185.199.109.153`
     - `185.199.110.153`
     - `185.199.111.153`
   - **CNAME record** for the `www` subdomain:
     - Host: `www`
     - Points to: `omoh46.github.io`
2. **In the GitHub repo settings → Pages**, set the custom domain to `rafaelstyles.com` and enable **Enforce HTTPS** once GitHub finishes issuing the certificate (can take a few minutes to a few hours after DNS propagates).
3. Add a `CNAME` file to the repo root containing exactly `rafaelstyles.com` (GitHub does this automatically when you set the custom domain in the Pages settings UI — no manual step needed if done that way).
4. DNS propagation can take up to 24–48 hours. Verify with `dig rafaelstyles.com` once added.

If Netlify is used instead of GitHub Pages, replace the A/CNAME targets above with the domain target Netlify provides in Site settings → Domain management (typically a CNAME to `<site-name>.netlify.app` or Netlify's load-balancer IP for the apex).

## What's intentionally NOT in this build

Per the build brief, GlossGenius backend configuration (calendar hours, deposit automation, surcharge line items, email/text templates) is a separate, future phase and is not part of this repo.
