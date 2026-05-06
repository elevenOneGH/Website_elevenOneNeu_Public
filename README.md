# elevenOne — Website (Public Deploy)

Statisches Multi-Page-Web der elevenOne GmbH. Vanilla HTML / CSS / JS, kein Build-Tool nötig.

→ Live unter [elevenone.at](https://elevenone.at)

## Tech-Stack

- **Stack**: Vanilla HTML/CSS/JS, mehrere Seiten
- **Fonts**: Manrope + IBM Plex Mono — **self-hosted** (DSGVO-konform, kein Drittland-Transfer)
- **Cookies**: Default keine — `gtag.js` (Google Ads) wird erst nach Consent-Akzept geladen
- **Aesthetik**: *Engineering Precision Editorial* — technische Zeichnungssprache + editorial Typo, dark only

## Lokale Entwicklung

```bash
# Python 3 ausreicht — kein Build-Tool, kein npm
python3 -m http.server 8765
# Browser → http://localhost:8765/
```

PowerShell auf Windows:

```powershell
py -m http.server 8765
```

## Subseiten generieren

Body-Fragments in [_build/](./_build/) liegen als `body-*.html` vor. Der Builder fügt sie in [_build/layout.html](./_build/layout.html) ein.

```powershell
.\_build\build.ps1 -Page kontakt
# Verfügbare Pages: datenschutz, ueber-uns, roadmap, kontakt, 404,
#   leistungen-index, ki-checkup, start-projekt, ki-roadmap-projekt,
#   six-steps, pcp-engineering
```

`index.html` und `recht/impressum.html` sind eigenständig gepflegt.

## Deploy auf Hetzner VPS

### Variante A — Nginx Static (empfohlen)

```bash
# 1) Auf VPS clonen
sudo git clone https://github.com/elevenOneGH/Website_elevenOneNeu_Public.git /var/www/elevenone
cd /var/www/elevenone

# 2) Nginx-Site anlegen
sudo nano /etc/nginx/sites-available/elevenone.conf
```

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name elevenone.at www.elevenone.at;

    root /var/www/elevenone;
    index index.html;

    # Saubere URLs ohne .html-Suffix
    location / {
        try_files $uri $uri.html $uri/ =404;
    }

    # Self-hosted Fonts: lange Cache, immutable
    location /assets/fonts/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        types { font/woff2 woff2; }
    }

    # Statische Assets: 30 Tage Cache
    location /assets/ {
        expires 30d;
        add_header Cache-Control "public";
    }

    # 404-Page
    error_page 404 /404.html;

    # Security Headers (DSGVO-konform)
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
}
```

```bash
# 3) Aktivieren + Reload
sudo ln -s /etc/nginx/sites-available/elevenone.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 4) Let's Encrypt SSL
sudo certbot --nginx -d elevenone.at -d www.elevenone.at
```

### Variante B — Caddy (alternative, automatic HTTPS)

```caddyfile
elevenone.at, www.elevenone.at {
    root * /var/www/elevenone
    file_server
    encode zstd gzip
    try_files {path} {path}.html {path}/ /404.html

    @fonts path /assets/fonts/*
    header @fonts Cache-Control "public, max-age=31536000, immutable"

    @assets path /assets/*
    header @assets Cache-Control "public, max-age=2592000"

    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        Referrer-Policy "strict-origin-when-cross-origin"
        Permissions-Policy "geolocation=(), microphone=(), camera=()"
    }
}
```

### Updates pullen

```bash
cd /var/www/elevenone
sudo git pull
sudo systemctl reload nginx
```

Optional Auto-Deploy via **GitHub Webhook** + Cron-Pull oder GitHub Actions.

## Vor Live-Gang noch zu erledigen

- [ ] Google Ads Conversion-ID in [assets/js/consent.js](./assets/js/consent.js) Zeile 13 (`AW-XXXXXXXXX`) eintragen
- [ ] og-cover.jpg (1200×630) in [assets/img/](./assets/img/) ablegen — aktuell Platzhalter
- [ ] Lighthouse-Audit & Rich-Results-Test
- [ ] DNS A/AAAA-Records auf VPS-IP zeigen lassen

## Struktur

```
.
├── index.html                          Hero + Produkt-Widgets + Methodik + Roadmap-Teaser
├── 404.html
├── kontakt.html                        Mailto-Hub
├── unternehmen/
│   ├── ueber-uns.html                  Founder Robert Hermann
│   └── roadmap.html                    Vertikale Timeline 2016–2026
├── leistungen/
│   ├── index.html                      Übersicht 3 Produkte
│   ├── ki-checkup.html                 Produkt 01
│   ├── start-projekt.html              Produkt 02
│   └── ki-roadmap-projekt.html         Produkt 03 (mit 6 QualityGates)
├── projektmanagement/
│   ├── six-steps.html                  Six Steps to Success
│   └── pcp-engineering.html            AI PCP-Engineering™
├── recht/
│   ├── impressum.html
│   └── datenschutz.html
├── assets/
│   ├── css/{tokens.css, style.css, site.css}
│   ├── js/{app, consent, hero-canvas, pcp-svg, widget-disclosure}.js
│   ├── fonts/                          Manrope (3 weights), IBM Plex Mono (2 weights)
│   └── img/                            Logos, Founder-Foto, PCP-Triangle
├── _build/                             Layout + Body-Fragments + PowerShell-Builder
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

Source-Repository (privat): `Website_elevenOneNeu_Projekt`
