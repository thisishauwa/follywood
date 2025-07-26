# Talk to August

**Talk to August** is a React Native app built using [Expo](https://expo.dev) and EAS Build/Update. This README outlines how to manage development, preview testing, and production builds using Expo Application Services (EAS).

---

## 📦 Project Overview

- **Name:** Talk to August
- **Slug:** `talk-to-august`
- **Owner:** `famasi`
- **Bundle Identifier:** `com.talktoaugust.app`
- **Runtime Version:** `1.0.0`
- **OTA Updates URL:** `https://u.expo.dev/3ff8458c-d0f7-4530-91f6-da3f267980ef`

---

## 🚀 Getting Started

1. **Install dependencies**

   ```bash
   pnpm install

2. **Login to Expo**

   Make sure you're logged into the `famasi` Expo team account:

   ```bash
   eas whoami
   ```

   If needed:

   ```bash
   eas logout
   eas login
   ```

---

## ⚙️ Development & Testing

### ✅ Create a Preview Build (for Expo Go testing)

We use [EAS Update](https://docs.expo.dev/eas-update/introduction/) to publish updates to the `preview` branch. Anyone with the Expo Go app can test the latest changes instantly.

```bash
eas update --branch preview --message "Describe this update"
```

After publishing, open the Expo Go app and scan the QR code from the terminal or Expo dashboard to preview the app, or use the link provided.

---

## 🏗️ Building for Stores

To generate production-ready binaries for submission to the App Store or Play Store, use EAS Build.

### Android:

```bash
eas build --platform android --profile production
```

### iOS:

```bash
eas build --platform ios --profile production
```

> Note: Make sure keystore (Android) or provisioning profiles (iOS) are correctly set up. EAS CLI will guide you if missing.

---

## 📂 Folder Structure

* `assets/fonts`: Contains all custom fonts (Larsseit & Recoleta)
* `app.config.js`: Dynamic configuration for Expo, including runtime versioning and environment variables
* `eas.json`: Contains build profiles (you can define `preview`, `development`, and `production` here)

---

## 📌 Environment Variables

The project uses environment variables configured under the `extra` field in `app.config.js`.

### Example:

```js
extra: {
  AUGUST_ENDPOINT: process.env.EXPO_PUBLIC_AUGUST_ENDPOINT
}
```

To define these variables, add them to your local environment or set them in your EAS dashboard under **Project Settings > Environment Variables**.

---

## 🧪 Local Development

You can create a development build using `expo-dev-client`:

```bash
npx expo install expo-dev-client
```

Then run:

```bash
eas build --profile development --platform android
```

Install the `.apk` or `.app` on your device/emulator and use it like Expo Go, but with support for native modules.

---

## 🗂️ Managing Fonts

All custom fonts are located in:

* `assets/fonts/bodyfont/`
* `assets/fonts/headerfont/`

Fonts are loaded via the `assetBundlePatterns` config and bundled during build.

---

## 🔗 Useful Links

* [EAS Update Docs](https://docs.expo.dev/eas-update/introduction/)
* [EAS Build Docs](https://docs.expo.dev/build/introduction/)
* [Expo Config Reference](https://docs.expo.dev/versions/latest/config/app/)

---

## 🧠 Notes

* Always commit code before running `eas update`
* Use descriptive messages when publishing or building (`--message`)
* Preview updates are tied to the `preview` branch; store builds are usually from `main` or `release` branches

---
