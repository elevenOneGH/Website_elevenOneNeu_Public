# elevenOne — Website (Public Deploy)

Statische Multi-Page-Website der elevenOne GmbH. Vanilla HTML / CSS / JS, kein Build-Tool nötig.

→ Live unter [elevenone.at](https://elevenone.at)

## Tech-Stack

- **Stack**: Vanilla HTML/CSS/JS, mehrere Seiten
- **Fonts**: Manrope + IBM Plex Mono — **self-hosted** (DSGVO-konform, kein Drittland-Transfer)
- **Cookies**: Default keine — `gtag.js` (Google Ads) wird erst nach Consent-Akzept geladen
- **Aesthetik**: *Engineering Precision Editorial* — technische Zeichnungssprache + editorial Typo, dark only

## Deployment

Diese Site wird via **Coolify** auf einem Hetzner-VPS deployt: https://coolify.elevenone.at/

### Schnell-Deploy-Setup (einmalig)

1. **Coolify** öffnen → New Resource → **Public Repository**
2. Repo-URL: `https://github.com/elevenOneGH/Website_elevenOneNeu_Public`
3. Branch: `main`
4. Build Pack: **Static** (oder Nixpacks falls Static fehlt)
5. Publish Directory: `.` (Punkt = Root)
6. Build Command: leer
7. Domains hinzufügen: `elevenone.at` + `www.elevenone.at`
8. Force HTTPS aktivieren — Let's Encrypt holt sich Cert automatisch
9. **GitHub Webhook** in Coolify-Resource aktivieren → URL ins GitHub-Repo (Settings → Webhooks)

### Automatische Updates

Jeder `git push` auf `main` → GitHub-Webhook → Coolify pullt + redeployt → Live in <30s.

## Lokale Entwicklung

```bash
python3 -m http.server 8765
# Browser → http://localhost:8765/
```

PowerShell auf Windows:

```powershell
py -m http.server 8765
```

## Subseiten generieren

Body-Fragments in [_build/](./_build/) als `body-*.html`. Der Builder fügt sie in [_build/layout.html](./_build/layout.html) ein.

```powershell
.\_build\build.ps1 -Page kontakt
# Verfügbare Pages: datenschutz, ueber-uns, roadmap, kontakt, 404,
#   leistungen-index, ki-checkup, start-projekt, ki-roadmap-projekt,
#   six-steps, pcp-engineering
```

`index.html` und `recht/impressum.html` sind eigenständig gepflegt.

## Alternativ-Deployment (ohne Coolify)

### Nginx Static

```nginx
server {
    listen 80;
    server_name elevenone.at www.elevenone.at;
    root /var/www/elevenone;
    index index.html;
    location / { try_files $uri $uri.html $uri/ =404; }
    location /assets/fonts/ { expires 1y; add_header Cache-Control "public, immutable"; }
    location /assets/ { expires 30d; add_header Cache-Control "public"; }
    error_page 404 /404.html;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

```bash
sudo certbot --nginx -d elevenone.at -d www.elevenone.at
```

### Caddy

```caddyfile
elevenone.at, www.elevenone.at {
    root * /var/www/elevenone
    file_server
    encode zstd gzip
    try_files {path} {path}.html {path}/ /404.html
    @fonts path /assets/fonts/*
    header @fonts Cache-Control "public, max-age=31536000, immutable"
    header /assets/* Cache-Control "public, max-age=2592000"
    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
}
```

## Vor Live-Gang

- [ ] Google Ads Conversion-ID in [assets/js/consent.js](./assets/js/consent.js) Zeile 13 (`AW-XXXXXXXXX`) ersetzen
- [ ] og-cover.jpg (1200×630) in [assets/img/](./assets/img/) ablegen
- [ ] DNS-A-Records für `elevenone.at` + `www` auf Hetzner-VPS-IP zeigen lassen (siehe internes Doku im Source-Repo)
- [ ] Lighthouse-Audit & Rich-Results-Test
- [ ] Coolify-Auto-Deploy-Webhook getestet

## Struktur

```
.
├── index.html
├── 404.html
├── kontakt.html
├── unternehmen/         (über-uns, roadmap)
├── leistungen/          (3 Produkte + Übersicht)
├── projektmanagement/   (six-steps, pcp-engineering)
├── recht/               (impressum, datenschutz)
├── assets/
│   ├── css/             (tokens, style, site)
│   ├── js/              (app, consent, hero-canvas, pcp-svg, widget-disclosure)
│   ├── fonts/           (Manrope 3 weights, IBM Plex Mono 2 weights)
│   └── img/
├── _build/              (Layout + Body-Fragments + PowerShell-Builder)
├── sitemap.xml
└── robots.txt
```

## Design-Tokens

| Token | Wert | Verwendung |
|---|---|---|
| `--copper-500` | `#A84221` | Primärer Brand-Akzent |
| `--ink` | `#0A0806` | Page-Background |
| `--carbon` | `#1A1410` | Card-Background |
| `--graphite` | `#2A2218` | Elevated Surface |
| `--bone` | `#E8E0D2` | Body-Text |
| `--bronze-500` | `#D4A040` | Sekundärer Akzent (Status) |

## Lizenz / Rechte

© elevenOne GmbH. Alle Rechte vorbehalten.
Logo, Schriftzug und PCP-Engineering™-Methodik sind Marken der elevenOne GmbH.

Verwendete Open-Source-Schriften unter SIL Open Font License (OFL):
- [Manrope](https://github.com/sharanda/manrope)
- [IBM Plex Mono](https://github.com/IBM/plex)

---

Source-Repository (privat, mit vollständiger Dokumentation):
[Website_elevenOneNeu_Projekt](https://github.com/elevenOneGH/Website_elevenOneNeu_Projekt)
