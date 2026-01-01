# Script to clear all caches for React Native/Expo project
Write-Host "Clearing all caches..." -ForegroundColor Yellow

# Stop Metro bundler if running
Write-Host "`n1. Stopping Metro bundler..." -ForegroundColor Cyan
Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*node*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Clear Metro bundler cache
Write-Host "2. Clearing Metro bundler cache..." -ForegroundColor Cyan
if (Test-Path "$env:TEMP\metro-*") {
    Remove-Item "$env:TEMP\metro-*" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path "$env:TEMP\haste-map-*") {
    Remove-Item "$env:TEMP\haste-map-*" -Recurse -Force -ErrorAction SilentlyContinue
}

# Clear watchman cache
Write-Host "3. Clearing Watchman cache..." -ForegroundColor Cyan
if (Get-Command watchman -ErrorAction SilentlyContinue) {
    watchman watch-del-all 2>$null
}

# Clear npm/yarn cache (optional)
Write-Host "4. Clearing node_modules cache..." -ForegroundColor Cyan
if (Test-Path "node_modules\.cache") {
    Remove-Item "node_modules\.cache" -Recurse -Force -ErrorAction SilentlyContinue
}

# Clear Android build cache
Write-Host "5. Clearing Android build cache..." -ForegroundColor Cyan
if (Test-Path "android\.gradle") {
    Remove-Item "android\.gradle" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path "android\app\build") {
    Remove-Item "android\app\build" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path "android\app\.cxx") {
    Remove-Item "android\app\.cxx" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path "android\build") {
    Remove-Item "android\build" -Recurse -Force -ErrorAction SilentlyContinue
}

# Clear Expo cache
Write-Host "6. Clearing Expo cache..." -ForegroundColor Cyan
if (Test-Path ".expo") {
    Remove-Item ".expo" -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "`n✅ All caches cleared!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Run: npx expo start --clear" -ForegroundColor White
Write-Host "2. Or rebuild Android: cd android; ./gradlew clean; ./gradlew assembleRelease" -ForegroundColor White


