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

# BreadcrumbList-JSON-LD pro Subseite (eingebettet in extraHead-Slot)
function Build-Breadcrumb {
  param([array]$Crumbs) # Array aus @{ name=...; url=... }
  $items = @()
  for ($i = 0; $i -lt $Crumbs.Count; $i++) {
    $c = $Crumbs[$i]
    $items += '{"@type":"ListItem","position":' + ($i + 1) + ',"name":"' + $c.name + '","item":"' + $c.url + '"}'
  }
  $payload = '{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[' + ($items -join ',') + ']}'
  return '<script type="application/ld+json">' + $payload + '</script>'
}

$bcLeistungen      = Build-Breadcrumb @( @{name='elevenOne'; url='https://elevenone.at/'}, @{name='Leistungen'; url='https://elevenone.at/leistungen/'} )
$bcKiCheckup       = Build-Breadcrumb @( @{name='elevenOne'; url='https://elevenone.at/'}, @{name='Leistungen'; url='https://elevenone.at/leistungen/'}, @{name='KI-Checkup'; url='https://elevenone.at/leistungen/ki-checkup.html'} )
$bcStartProjekt    = Build-Breadcrumb @( @{name='elevenOne'; url='https://elevenone.at/'}, @{name='Leistungen'; url='https://elevenone.at/leistungen/'}, @{name='Start-Projekt'; url='https://elevenone.at/leistungen/start-projekt.html'} )
$bcKiRoadmap       = Build-Breadcrumb @( @{name='elevenOne'; url='https://elevenone.at/'}, @{name='Leistungen'; url='https://elevenone.at/leistungen/'}, @{name='KI-Roadmap-Projekt'; url='https://elevenone.at/leistungen/ki-roadmap-projekt.html'} )
$bcSixSteps        = Build-Breadcrumb @( @{name='elevenOne'; url='https://elevenone.at/'}, @{name='Six Steps to Success'; url='https://elevenone.at/projektmanagement/six-steps.html'} )
$bcPcpEngineering  = Build-Breadcrumb @( @{name='elevenOne'; url='https://elevenone.at/'}, @{name='AI PCP-Engineering'; url='https://elevenone.at/projektmanagement/pcp-engineering.html'} )
$bcUeberUns        = Build-Breadcrumb @( @{name='elevenOne'; url='https://elevenone.at/'}, @{name='Wir über uns'; url='https://elevenone.at/unternehmen/ueber-uns.html'} )
$bcRoadmap         = Build-Breadcrumb @( @{name='elevenOne'; url='https://elevenone.at/'}, @{name='Roadmap'; url='https://elevenone.at/unternehmen/roadmap.html'} )
$bcKontakt         = Build-Breadcrumb @( @{name='elevenOne'; url='https://elevenone.at/'}, @{name='Kontakt'; url='https://elevenone.at/kontakt.html'} )
$bcDatenschutz     = Build-Breadcrumb @( @{name='elevenOne'; url='https://elevenone.at/'}, @{name='Datenschutzerklärung'; url='https://elevenone.at/recht/datenschutz.html'} )

$pages = @{
  'datenschutz'        = @{ out='recht\datenschutz.html'; canonical='/recht/datenschutz'; title='Datenschutzerklärung — elevenOne GmbH'; desc='Datenschutzerklärung der elevenOne GmbH gemäß DSGVO. Informationen zu Hosting bei Hetzner, Self-hosted Fonts, Cookie-Consent und Ihren Rechten.'; robots='index,follow'; bodyFile='body-datenschutz.html'; extraScripts=''; extraHead=$bcDatenschutz }
  'ueber-uns'          = @{ out='unternehmen\ueber-uns.html'; canonical='/unternehmen/ueber-uns'; title='Wir über uns — elevenOne GmbH'; desc='Robert Hermann und elevenOne GmbH — vom HTL-Maschinenbau über DB-Schenker-Großprojekte zur KI-Agentur.'; robots='index,follow'; bodyFile='body-ueber-uns.html'; extraScripts=''; extraHead=$bcUeberUns }
  'roadmap'            = @{ out='unternehmen\roadmap.html'; canonical='/unternehmen/roadmap'; title='Roadmap — Zehn Jahre elevenOne'; desc='Von TMS-Prozessmanagement und IoT über RPA und ERP-Rollouts zur KI-Service-Agentur. Zehn Jahre Transformations-Erfahrung.'; robots='index,follow'; bodyFile='body-roadmap.html'; extraScripts=''; extraHead=$bcRoadmap }
  'kontakt'            = @{ out='kontakt.html'; canonical='/kontakt'; title='Kontakt — elevenOne GmbH'; desc='Termin für ein Erstgespräch zur KI-Transformation. Wir antworten innerhalb von 24 Stunden mit konkreten Terminvorschlägen.'; robots='index,follow'; bodyFile='body-kontakt.html'; extraScripts=''; extraHead=$bcKontakt }
  '404'                = @{ out='404.html'; canonical='/'; title='Seite nicht gefunden — elevenOne'; desc='Diese Seite existiert nicht oder wurde verschoben. Wechseln Sie zur Startseite, zu den Leistungen oder direkt zum Kontaktformular.'; robots='noindex,follow'; bodyFile='body-404.html'; extraScripts=''; extraHead='' }
  'leistungen-index'   = @{ out='leistungen\index.html'; canonical='/leistungen/'; title='Leistungen — KI-Beratung & Agentur · elevenOne'; desc='Drei Wege in die KI-Transformation für KMU: KI-Checkup in 24 Stunden, Start-Projekt mit Pilot, KI-Roadmap-Projekt mit 6 QualityGates.'; robots='index,follow'; bodyFile='body-leistungen-index.html'; extraScripts=''; extraHead=$bcLeistungen }
  'ki-checkup'         = @{ out='leistungen\ki-checkup.html'; canonical='/leistungen/ki-checkup'; title='KI-Checkup — Status quo & Finanzreport · elevenOne'; desc='KI-Checkup-Termin: Status-quo-Audit, Maßnahmen-Klassifizierung und KI-Finanzreport aus Saldenlisten — alles in unter 24 Stunden.'; robots='index,follow'; bodyFile='body-ki-checkup.html'; extraScripts=''; extraHead=$bcKiCheckup }
  'start-projekt'      = @{ out='leistungen\start-projekt.html'; canonical='/leistungen/start-projekt'; title='Start-Projekt + Support — Erste KI-Implementierung · elevenOne'; desc='Vom 24-Stunden-Audit zur ersten Pilot-Implementierung. Inkl. KI-Zielsetzung, Kernteam-Ausbildung und laufendem Support nach Go-live.'; robots='index,follow'; bodyFile='body-start-projekt.html'; extraScripts=''; extraHead=$bcStartProjekt }
  'ki-roadmap-projekt' = @{ out='leistungen\ki-roadmap-projekt.html'; canonical='/leistungen/ki-roadmap-projekt'; title='KI-Roadmap-Projekt — Vollständige Transformation · elevenOne'; desc='Ganzheitliche KI-Transformation mit 6-QualityGate-Modell, Change Management und temporärem KI-Manager.'; robots='index,follow'; bodyFile='body-ki-roadmap-projekt.html'; extraScripts=''; extraHead=$bcKiRoadmap }
  'six-steps'          = @{ out='projektmanagement\six-steps.html'; canonical='/projektmanagement/six-steps'; title='Six Steps to Success — elevenOne PM-Modell'; desc='Sechs Schritte zur erfolgreichen Projektumsetzung mit QualityGate-Kriterien an jedem Übergang. Das elevenOne Projektmanagement-Modell.'; robots='index,follow'; bodyFile='body-six-steps.html'; extraScripts=''; extraHead=$bcSixSteps }
  'pcp-engineering'    = @{ out='projektmanagement\pcp-engineering.html'; canonical='/projektmanagement/pcp-engineering'; title='AI PCP-Engineering™ — Methodik · elevenOne'; desc='Process · Cost · Performance — die drei Säulen der elevenOne KI-Transformations-Methodik mit ROI-Nachweis und Change-Management-Anker.'; robots='index,follow'; bodyFile='body-pcp-engineering.html'; extraScripts=''; extraHead=$bcPcpEngineering }
}

if (-not $pages.ContainsKey($Page)) { Write-Error "Unbekannte Seite: $Page"; return }
$p = $pages[$Page]
$bodyPath = Join-Path $PSScriptRoot $p.bodyFile
if (-not (Test-Path $bodyPath)) { Write-Error "Body-Fragment fehlt: $bodyPath"; return }

$body = Read-UTF8 $bodyPath
$html = $layout
$buildDate = Get-Date -Format 'yyyyMMdd'
$html = $html.Replace('{{TITLE}}', $p.title)
$html = $html.Replace('{{DESCRIPTION}}', $p.desc)
$html = $html.Replace('{{CANONICAL}}', $p.canonical)
$html = $html.Replace('{{ROBOTS}}', $p.robots)
$extraHead = if ($p.ContainsKey('extraHead')) { $p.extraHead } else { '' }
$html = $html.Replace('{{EXTRA_HEAD}}', $extraHead)
$html = $html.Replace('{{EXTRA_SCRIPTS}}', $p.extraScripts)
$html = $html.Replace('{{BUILD_DATE}}', $buildDate)
$html = $html.Replace('{{CONTENT}}', $body)

$outPath = Join-Path $root $p.out
$outDir = Split-Path -Parent $outPath
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force | Out-Null }
Write-UTF8NoBom $outPath $html
Write-Output "Built: $($p.out)"
