# GreenLens Mobile App Setup

## Environment Setup

This app requires a Google Maps API key to display maps.

### 1. Get a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable these APIs:
   - **Maps SDK for Android**
   - **Maps SDK for iOS** (if building for iOS)
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Copy your API key

### 2. Configure the App

Create a `.env` file in the `mobile/` directory:

```bash
cp .env.example .env
```

Edit `.env` and add your API key:

```env
GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

### 3. Run the App

```bash
npm install
npx expo start
```

## Security Notes

- **Never commit `.env` or `app.json` files with real API keys**
- The `.gitignore` is configured to exclude these files
- Use `app.config.js` which reads from environment variables
- For production builds, use EAS Secrets:
  ```bash
  eas secret:create --scope project --name GOOGLE_MAPS_API_KEY --value your_key
  ```

## Files

- `app.config.js` - Main config file (uses env variables) ✅ Committed
- `.env` - Your local secrets ⛔ **NOT committed**
- `.env.example` - Template file ✅ Committed
- `app.json` - Legacy config with placeholders ⛔ **NOT committed**
