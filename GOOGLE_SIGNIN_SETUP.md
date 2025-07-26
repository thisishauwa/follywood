# Google Sign-In Setup for TestFlight

This document provides instructions for fixing Google Sign-In crashes on TestFlight builds.

## Issues Identified

1. **Missing Plugin Configuration**: The `app.json` was missing the Google Sign-In plugin configuration
2. **Missing URL Schemes**: iOS requires specific URL schemes for Google Sign-In to work
3. **Environment Variables**: Client IDs need to be properly configured for production builds
4. **Error Handling**: Enhanced error handling has been added for better debugging

## Fixed Configuration

### 1. Updated app.json

The following changes have been made to `app.json`:

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "CFBundleURLTypes": [
          {
            "CFBundleURLName": "com.mycompany.talktoaugust",
            "CFBundleURLSchemes": ["com.mycompany.talktoaugust", "talktoaugust"]
          },
          {
            "CFBundleURLName": "GoogleSignIn",
            "CFBundleURLSchemes": ["com.googleusercontent.apps.YOUR_IOS_CLIENT_ID"]
          }
        ]
      }
    },
    "plugins": [
      // ... other plugins
      [
        "@react-native-google-signin/google-signin",
        {
          "iosUrlScheme": "com.googleusercontent.apps.YOUR_IOS_CLIENT_ID"
        }
      ]
    ]
  }
}
```

### 2. Required Environment Variables

Make sure these environment variables are set in your `.env` file:

```env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id_here
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id_here
```

## Setup Instructions

### Step 1: Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Enable the Google Sign-In API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"

### Step 2: Create iOS Client ID

1. Select "iOS" as the application type
2. Enter your bundle identifier: `com.mycompany.talktoaugust`
3. Copy the generated iOS Client ID

### Step 3: Create Web Client ID

1. Select "Web application" as the application type
2. Add authorized redirect URIs if needed
3. Copy the generated Web Client ID

### Step 4: Update Configuration Files

1. **Update .env file**:
   ```env
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id_here.apps.googleusercontent.com
   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id_here.apps.googleusercontent.com
   ```

2. **Update app.json**:
   Replace `YOUR_IOS_CLIENT_ID` with your actual iOS Client ID:
   ```json
   "CFBundleURLSchemes": ["com.googleusercontent.apps.YOUR_ACTUAL_IOS_CLIENT_ID"]
   ```
   
   And in the plugin configuration:
   ```json
   "iosUrlScheme": "com.googleusercontent.apps.YOUR_ACTUAL_IOS_CLIENT_ID"
   ```

### Step 5: Rebuild and Test

1. Clear Expo cache: `expo start --clear`
2. Create a new development build: `eas build --platform ios --profile development`
3. Create a new TestFlight build: `eas build --platform ios --profile production`
4. Test Google Sign-In on both development and TestFlight builds

## Enhanced Error Handling

The Google Sign-In implementation now includes:

- **Detailed logging** for debugging configuration issues
- **Platform-specific error handling** for iOS vs Android
- **Network error detection** and user-friendly messages
- **Configuration validation** to catch missing client IDs
- **Improved error codes** for better error tracking

## Common Issues and Solutions

### Issue 1: "Google Sign-In configuration error"
**Solution**: Verify that your client IDs are correctly set in the environment variables and match the ones in Google Cloud Console.

### Issue 2: "No ID token received from Google"
**Solution**: This usually indicates a configuration issue. Check that:
- The iOS Client ID is correctly configured
- The bundle identifier matches what's in Google Cloud Console
- The URL schemes are properly set in app.json

### Issue 3: App crashes immediately on Google Sign-In
**Solution**: This is typically caused by missing URL schemes. Ensure:
- The Google Sign-In plugin is properly configured in app.json
- The iOS Client ID URL scheme is added to CFBundleURLTypes
- The app has been rebuilt after configuration changes

### Issue 4: Works in development but crashes on TestFlight
**Solution**: 
- Ensure environment variables are properly set for production builds
- Verify that the production bundle identifier matches Google Cloud Console
- Check that the iOS Client ID is for the production app, not development

## Testing Checklist

- [ ] Google Sign-In works in Expo Go (with proper error message if not supported)
- [ ] Google Sign-In works in development build
- [ ] Google Sign-In works in TestFlight build
- [ ] Error messages are user-friendly and informative
- [ ] Fallback to OTP sign-in works when Google Sign-In fails
- [ ] Console logs provide sufficient debugging information

## Support

If you continue to experience issues:

1. Check the console logs for detailed error information
2. Verify all configuration steps have been completed
3. Test with a fresh development build
4. Contact the development team with specific error codes and logs
