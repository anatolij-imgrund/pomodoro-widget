<#
.SYNOPSIS
    Baut das Pomodoro-Widget als MSIX-Paket für den Microsoft Store.

.DESCRIPTION
    1. Baut die App mit Tauri (ohne MSI/EXE-Installer).
    2. Stellt den Paketordner zusammen (exe, Store-Icons, AppxManifest.xml).
    3. Packt alles mit makeappx.exe aus dem Windows SDK zu einer .msix-Datei.

    Das Paket wird NICHT signiert: Der Microsoft Store signiert es nach der Prüfung selbst.

.PARAMETER Test
    Baut nur den Paketordner und installiert ihn lokal zum Ausprobieren
    (Add-AppxPackage -Register). Dafür muss in Windows der Entwicklermodus an sein:
    Einstellungen > System > Für Entwickler > Entwicklermodus.
    Funktioniert auch, bevor msix/identity.json ausgefüllt ist.

.PARAMETER SkipBuild
    Überspringt "tauri build" und nimmt die zuletzt gebaute exe.

.EXAMPLE
    .\scripts\build-msix.ps1 -Test
    .\scripts\build-msix.ps1
#>
param(
    [switch]$Test,
    [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Write-Step($text) { Write-Host "`n==> $text" -ForegroundColor Cyan }

# ---------------------------------------------------------------------------
# 1. Store-Identität und Version
# ---------------------------------------------------------------------------
Write-Step 'Lese msix/identity.json und Version'

$identity = Get-Content -Raw -Encoding UTF8 'msix/identity.json' | ConvertFrom-Json
$notFilled = ($identity.Name -like '*BITTE*') -or ($identity.Publisher -like '*BITTE*')

if ($notFilled -and -not $Test) {
    throw 'Bitte zuerst msix/identity.json mit den Werten aus Partner Center füllen (siehe README, Abschnitt Microsoft Store).'
}
if ($notFilled) {
    Write-Host 'identity.json ist noch nicht ausgefüllt, nehme Test-Werte.' -ForegroundColor Yellow
    $identity.Name = 'PomodoroWidget.LokalerTest'
    $identity.Publisher = 'CN=LokalerTest'
}

$conf = Get-Content -Raw -Encoding UTF8 'src-tauri/tauri.conf.json' | ConvertFrom-Json
# MSIX braucht vier Zahlen, z. B. 0.1.0 -> 0.1.0.0
$version = "$($conf.version).0"
Write-Host "Paket: $($identity.Name)  Version: $version"

# ---------------------------------------------------------------------------
# 2. App bauen
# ---------------------------------------------------------------------------
if (-not $SkipBuild) {
    Write-Step 'Baue die App (npm run tauri build -- --no-bundle)'
    npm run tauri build -- --no-bundle
    if ($LASTEXITCODE -ne 0) { throw 'tauri build ist fehlgeschlagen.' }
}

$exe = Join-Path $root 'src-tauri/target/release/app.exe'
if (-not (Test-Path $exe)) { throw "Keine exe gefunden: $exe" }

# ---------------------------------------------------------------------------
# 3. Paketordner zusammenstellen
# ---------------------------------------------------------------------------
Write-Step 'Stelle den Paketordner zusammen'

$outDir = Join-Path $root 'msix-out'
$pkgDir = Join-Path $outDir 'package'

# Ein lokal registriertes Testpaket zeigt auf diesen Ordner: erst abmelden
if (Test-Path $pkgDir) {
    $old = Get-AppxPackage -Name $identity.Name -ErrorAction SilentlyContinue
    if ($old) {
        Write-Host 'Entferne vorherige Testinstallation...'
        $old | Remove-AppxPackage
    }
    Remove-Item $pkgDir -Recurse -Force
}
New-Item -ItemType Directory -Path (Join-Path $pkgDir 'Assets') -Force | Out-Null

Copy-Item $exe (Join-Path $pkgDir 'Pomodoro-Widget.exe')
Copy-Item 'msix/Assets/*.png' (Join-Path $pkgDir 'Assets')

function ConvertTo-XmlText($text) { [System.Security.SecurityElement]::Escape([string]$text) }

$manifest = Get-Content -Raw -Encoding UTF8 'msix/AppxManifest.xml'
$manifest = $manifest.Replace('{{NAME}}', (ConvertTo-XmlText $identity.Name))
$manifest = $manifest.Replace('{{PUBLISHER}}', (ConvertTo-XmlText $identity.Publisher))
$manifest = $manifest.Replace('{{PUBLISHER_DISPLAY_NAME}}', (ConvertTo-XmlText $identity.PublisherDisplayName))
$manifest = $manifest.Replace('{{DISPLAY_NAME}}', (ConvertTo-XmlText $identity.DisplayName))
$manifest = $manifest.Replace('{{VERSION}}', $version)

if ($manifest -match '\{\{') { throw 'Im Manifest sind noch Platzhalter übrig.' }
[xml]$manifest | Out-Null   # bricht ab, falls das XML kaputt ist

# UTF-8 ohne BOM schreiben (funktioniert in Windows PowerShell 5.1 und PowerShell 7)
$utf8 = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText((Join-Path $pkgDir 'AppxManifest.xml'), $manifest, $utf8)

# ---------------------------------------------------------------------------
# 4a. Testmodus: lokal installieren
# ---------------------------------------------------------------------------
if ($Test) {
    Write-Step 'Installiere das Paket lokal zum Testen'
    Add-AppxPackage -Register (Join-Path $pkgDir 'AppxManifest.xml')
    Write-Host "`nFertig! Das Widget steht jetzt im Startmenü als '$($identity.DisplayName)'." -ForegroundColor Green
    Write-Host "Wieder entfernen: Get-AppxPackage -Name '$($identity.Name)' | Remove-AppxPackage"
    return
}

# ---------------------------------------------------------------------------
# 4b. Store-Modus: .msix packen
# ---------------------------------------------------------------------------
Write-Step 'Suche makeappx.exe aus dem Windows SDK'

$kits = Join-Path ${env:ProgramFiles(x86)} 'Windows Kits\10\bin'
$makeappx = Get-ChildItem $kits -Recurse -Filter 'makeappx.exe' -ErrorAction SilentlyContinue |
    Where-Object { $_.Directory.Name -eq 'x64' -and $_.Directory.Parent.Name -match '^\d+(\.\d+)+$' } |
    Sort-Object { [version]$_.Directory.Parent.Name } -Descending |
    Select-Object -First 1

if (-not $makeappx) {
    throw 'makeappx.exe nicht gefunden. Windows SDK installieren, z. B.: winget install Microsoft.WindowsSDK.10.0.26100'
}
Write-Host $makeappx.FullName

$msix = Join-Path $outDir "PomodoroWidget_$($version)_x64.msix"
Write-Step "Packe $msix"
& $makeappx.FullName pack /d $pkgDir /p $msix /o
if ($LASTEXITCODE -ne 0) { throw 'makeappx ist fehlgeschlagen.' }

Write-Host "`nFertig: $msix" -ForegroundColor Green
Write-Host 'Diese Datei in Partner Center bei "Pakete" hochladen (unsigniert, Microsoft signiert selbst).'
