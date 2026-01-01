# Setup Environment Files for Neon X.O

Write-Host "Setting up environment files..." -ForegroundColor Cyan

# Root .env.local
$rootContent = "MONGODB_URI=mongodb+srv://huyht1302_db_user:BkfNoeRdUBRGtokJ@cluster0.cvn9qfc.mongodb.net/?appName=Cluster0`nPORT=3000`nEXPO_PUBLIC_BACKEND_URL=http://localhost:3000`nEXPO_PUBLIC_SOCKET_URL=http://localhost:3000"
$rootContent | Out-File -FilePath ".env.local" -Encoding utf8
Write-Host "Created .env.local in root" -ForegroundColor Green

# Server .env.local
$serverContent = "MONGODB_URI=mongodb+srv://huyht1302_db_user:BkfNoeRdUBRGtokJ@cluster0.cvn9qfc.mongodb.net/?appName=Cluster0`nPORT=3000"
$serverPath = Join-Path "server" ".env.local"
$serverContent | Out-File -FilePath $serverPath -Encoding utf8
Write-Host "Created server\.env.local" -ForegroundColor Green

Write-Host ""
Write-Host "Environment setup complete!" -ForegroundColor Green
Write-Host "You can now run: npm run dev" -ForegroundColor Yellow
