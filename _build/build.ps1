# Build-Script für elevenOne — fügt Body-Fragments in layout.html ein.
# Nutzt .NET-IO mit explizitem UTF-8 (no BOM) gegen PS-5.1 Mojibake.
param([Parameter(Mandatory)]$Page)

$root = Split-Path -Parent $PSScriptRoot
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Read-UTF8($path) {
  return [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
}
function Write-UTF8NoBom($path, $content) {
  [System.IO.File]::WriteAllText($path, $content, $script:utf8NoBom)
}

$script:utf8NoBom = $utf8NoBom

$layout = Read-UTF8 (Join-Path $PSScriptRoot 'layout.html')

$pages = @{
  'datenschutz'        = @{ out='recht\datenschutz.html'; canonical='/recht/datenschutz.html'; title='Datenschutzerklärung — elevenOne GmbH'; desc='Datenschutzerklärung gemäß DSGVO für elevenOne GmbH.'; robots='index,follow'; bodyFile='body-datenschutz.html'; extraScripts='' }
  'ueber-uns'          = @{ out='unternehmen\ueber-uns.html'; canonical='/unternehmen/ueber-uns.html'; title='Wir über uns — elevenOne GmbH'; desc='Robert Hermann und elevenOne GmbH — vom HTL-Maschinenbau über DB-Schenker-Großprojekte zur KI-Agentur.'; robots='index,follow'; bodyFile='body-ueber-uns.html'; extraScripts='' }
  'roadmap'            = @{ out='unternehmen\roadmap.html'; canonical='/unternehmen/roadmap.html'; title='Roadmap — Zehn Jahre elevenOne'; desc='Von TMS-Prozessmanagement und IoT über RPA und ERP-Rollouts zur KI-Service-Agentur. Zehn Jahre Transformations-Erfahrung.'; robots='index,follow'; bodyFile='body-roadmap.html'; extraScripts='' }
  'kontakt'            = @{ out='kontakt.html'; canonical='/kontakt.html'; title='Kontakt — elevenOne GmbH'; desc='Termin anfragen für Erstgespräch zur KI-Transformation. Innerhalb von 24 Stunden Antwort.'; robots='index,follow'; bodyFile='body-kontakt.html'; extraScripts='' }
  '404'                = @{ out='404.html'; canonical='/404.html'; title='Seite nicht gefunden — elevenOne'; desc='Diese Seite existiert nicht.'; robots='noindex,follow'; bodyFile='body-404.html'; extraScripts='' }
  'leistungen-index'   = @{ out='leistungen\index.html'; canonical='/leistungen/'; title='Leistungen — KI-Beratung & Agentur'; desc='Drei Wege in die KI-Transformation: Checkup, Start-Projekt, KI-Roadmap-Projekt.'; robots='index,follow'; bodyFile='body-leistungen-index.html'; extraScripts='' }
  'ki-checkup'         = @{ out='leistungen\ki-checkup.html'; canonical='/leistungen/ki-checkup.html'; title='KI-Checkup — Status quo & Finanzreport in 24 Stunden'; desc='KI-Checkup-Termin: Status-quo-Audit, Maßnahmen-Klassifizierung und KI-Finanzreport aus Saldenlisten — alles in unter 24 Stunden.'; robots='index,follow'; bodyFile='body-ki-checkup.html'; extraScripts='' }
  'start-projekt'      = @{ out='leistungen\start-projekt.html'; canonical='/leistungen/start-projekt.html'; title='Start-Projekt + Support — Erste KI-Implementierung'; desc='Vom Audit zur ersten Pilot-Implementierung. Inkl. Kernteam-Ausbildung und laufendem Support.'; robots='index,follow'; bodyFile='body-start-projekt.html'; extraScripts='' }
  'ki-roadmap-projekt' = @{ out='leistungen\ki-roadmap-projekt.html'; canonical='/leistungen/ki-roadmap-projekt.html'; title='KI-Roadmap-Projekt — Vollständige Transformation'; desc='Ganzheitliche KI-Transformation mit 6-QualityGate-Modell, Change Management und temporärem KI-Manager.'; robots='index,follow'; bodyFile='body-ki-roadmap-projekt.html'; extraScripts='' }
  'six-steps'          = @{ out='projektmanagement\six-steps.html'; canonical='/projektmanagement/six-steps.html'; title='Six Steps to Success — elevenOne PM-Modell'; desc='Sechs Schritte zur erfolgreichen Projektumsetzung mit QualityGate-Kriterien an jedem Übergang.'; robots='index,follow'; bodyFile='body-six-steps.html'; extraScripts='' }
  'pcp-engineering'    = @{ out='projektmanagement\pcp-engineering.html'; canonical='/projektmanagement/pcp-engineering.html'; title='AI PCP-Engineering™ — Methodik'; desc='Process · Cost · Performance — die drei Säulen der elevenOne KI-Transformations-Methodik.'; robots='index,follow'; bodyFile='body-pcp-engineering.html'; extraScripts='' }
}

if (-not $pages.ContainsKey($Page)) { Write-Error "Unbekannte Seite: $Page"; return }
$p = $pages[$Page]
$bodyPath = Join-Path $PSScriptRoot $p.bodyFile
if (-not (Test-Path $bodyPath)) { Write-Error "Body-Fragment fehlt: $bodyPath"; return }

$body = Read-UTF8 $bodyPath
$html = $layout
$html = $html.Replace('{{TITLE}}', $p.title)
$html = $html.Replace('{{DESCRIPTION}}', $p.desc)
$html = $html.Replace('{{CANONICAL}}', $p.canonical)
$html = $html.Replace('{{ROBOTS}}', $p.robots)
$html = $html.Replace('{{EXTRA_HEAD}}', '')
$html = $html.Replace('{{EXTRA_SCRIPTS}}', $p.extraScripts)
$html = $html.Replace('{{CONTENT}}', $body)

$outPath = Join-Path $root $p.out
$outDir = Split-Path -Parent $outPath
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force | Out-Null }
Write-UTF8NoBom $outPath $html
Write-Output "Built: $($p.out)"
