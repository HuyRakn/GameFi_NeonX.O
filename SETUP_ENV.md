# Environment Setup

Tạo file `.env.local` trong thư mục root với nội dung:

```
MONGODB_URI=mongodb+srv://huyht1302_db_user:BkfNoeRdUBRGtokJ@cluster0.cvn9qfc.mongodb.net/?appName=Cluster0
PORT=3000
EXPO_PUBLIC_BACKEND_URL=http://localhost:3000
EXPO_PUBLIC_SOCKET_URL=http://localhost:3000
```

Tạo file `server/.env.local` với nội dung:

```
MONGODB_URI=mongodb+srv://huyht1302_db_user:BkfNoeRdUBRGtokJ@cluster0.cvn9qfc.mongodb.net/?appName=Cluster0
PORT=3000
```

## Quick Setup (PowerShell)

```powershell
# Root .env.local
@"
MONGODB_URI=mongodb+srv://huyht1302_db_user:BkfNoeRdUBRGtokJ@cluster0.cvn9qfc.mongodb.net/?appName=Cluster0
PORT=3000
EXPO_PUBLIC_BACKEND_URL=http://localhost:3000
EXPO_PUBLIC_SOCKET_URL=http://localhost:3000
"@ | Out-File -FilePath .env.local -Encoding utf8

# Server .env.local
@"
MONGODB_URI=mongodb+srv://huyht1302_db_user:BkfNoeRdUBRGtokJ@cluster0.cvn9qfc.mongodb.net/?appName=Cluster0
PORT=3000
"@ | Out-File -FilePath server\.env.local -Encoding utf8
```


