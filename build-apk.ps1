# ============================================================
# build-apk.ps1
# Full pipeline: Web build -> Capacitor sync -> Gradle APK -> Install
# ============================================================

$ErrorActionPreference = "Stop"

function Step($n, $text) {
    Write-Host ""
    Write-Host ">> [$n/5] $text" -ForegroundColor Yellow
}

function OK($text) {
    Write-Host "   [OK] $text" -ForegroundColor Green
}

function Err($text) {
    Write-Host "   [X] $text" -ForegroundColor Red
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Admin Panel - Android APK Build" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

Set-Location $PSScriptRoot

# --- 1. Web build ---
Step 1 "Building web app (Vite)..."
npm run build
if ($LASTEXITCODE -ne 0) { Err "Web build failed."; exit 1 }
OK "Web built -> dist/"

# --- 2. Capacitor sync ---
Step 2 "Syncing assets to Android..."
npx cap sync android
if ($LASTEXITCODE -ne 0) { Err "Capacitor sync failed."; exit 1 }
OK "Synced to android/"

# --- 3. Gradle build ---
Step 3 "Compiling APK with Gradle..."
Set-Location "$PSScriptRoot\android"
.\gradlew.bat assembleDebug
if ($LASTEXITCODE -ne 0) { Err "Gradle build failed."; exit 1 }

$apk = "$PSScriptRoot\android\app\build\outputs\apk\debug\app-debug.apk"
if (-not (Test-Path $apk)) { Err "APK not found at $apk"; exit 1 }
OK "APK ready: $apk"

# --- 4. Device check ---
Step 4 "Looking for connected device..."
Set-Location $PSScriptRoot
$devices = adb devices 2>$null | Select-String "\sdevice$"

if (-not $devices) {
    Write-Host "   [!] No device connected." -ForegroundColor Yellow
    Write-Host "       Connect phone with USB debugging enabled, then run:" -ForegroundColor Gray
    Write-Host "       adb install -r `"$apk`"" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   APK location: $apk" -ForegroundColor Green
    Write-Host ""
    exit 0
}

# --- 5. Install ---
Step 5 "Installing on device..."
adb install -r $apk

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "   [OK][OK][OK] APK installed successfully! [OK][OK][OK]" -ForegroundColor Green
    Write-Host "        Look for 'Admin Panel' on your phone." -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "   [!] Install failed. Try:" -ForegroundColor Yellow
    Write-Host "       adb uninstall com.shabab.pmadmin" -ForegroundColor Gray
    Write-Host "       .\build-apk.ps1" -ForegroundColor Gray
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan