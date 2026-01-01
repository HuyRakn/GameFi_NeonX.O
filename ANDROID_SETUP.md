# Android Setup Guide

## Vấn đề: SDK location not found

Nếu gặp lỗi:
```
SDK location not found. Define a valid SDK location with an ANDROID_HOME environment variable or by setting the sdk.dir path in your project's local properties file
```

## Giải pháp

### Option 1: Tự động (Recommended)

File `android/local.properties` đã được tạo tự động với đường dẫn SDK mặc định:
```
sdk.dir=C\:\\Users\\no999\\AppData\\Local\\Android\\Sdk
```

### Option 2: Manual

Nếu SDK ở vị trí khác, tạo file `android/local.properties` với nội dung:

**Windows:**
```
sdk.dir=C\:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk
```

**Mac/Linux:**
```
sdk.dir=/Users/YourUsername/Library/Android/sdk
```

### Option 3: Environment Variable

Set environment variable `ANDROID_HOME`:

**Windows PowerShell:**
```powershell
$env:ANDROID_HOME = "C:\Users\YourUsername\AppData\Local\Android\Sdk"
[System.Environment]::SetEnvironmentVariable('ANDROID_HOME', $env:ANDROID_HOME, 'User')
```

**Windows CMD:**
```cmd
setx ANDROID_HOME "C:\Users\YourUsername\AppData\Local\Android\Sdk"
```

**Mac/Linux:**
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
echo 'export ANDROID_HOME=$HOME/Library/Android/sdk' >> ~/.bashrc
```

## Kiểm tra Android SDK

Đảm bảo Android SDK đã được cài đặt qua Android Studio:
1. Mở Android Studio
2. Tools > SDK Manager
3. Cài đặt Android SDK Platform và Build Tools

## Build Commands

```bash
# Build và chạy trên Android
npx expo run:android

# Hoặc
npm run android

# Build APK release
cd android
./gradlew assembleRelease
```

## Troubleshooting

### SDK không tìm thấy
- Kiểm tra đường dẫn trong `android/local.properties`
- Đảm bảo Android SDK đã được cài đặt
- Restart terminal sau khi set environment variable

### Gradle build fails
- Clear cache: `cd android && ./gradlew clean`
- Xóa `.gradle` folder: `rm -rf android/.gradle`
- Rebuild: `npx expo prebuild --clean`

