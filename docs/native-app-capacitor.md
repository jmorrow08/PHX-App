# PHX Native App — Capacitor Wrapper Guide

Goal: ship PHX to the App Store and Play Store with **bulletproof background
audio** (the one thing the web app can't fully deliver on iOS) while keeping
one codebase — the exact same HTML/JS deployed to Vercel.

## Strategy: remote-URL shell

The fastest correct approach for PHX today is a Capacitor shell that loads the
live site. Every web deploy instantly updates the apps — no store re-review for
content changes (Apple permits this for hybrid apps when core functionality is
in the binary's declared behavior; keep the shell honest).

```bash
# One-time setup (from repo root)
mkdir phx-native && cd phx-native
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npx cap init "PHX" "com.phxapp.phx" --web-dir=www
mkdir www && cp ../phx/index.html www/   # placeholder; real content is remote
```

`capacitor.config.ts`:
```ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.phxapp.phx',
  appName: 'PHX',
  webDir: 'www',
  server: {
    url: 'https://thephx.app/app',
    allowNavigation: ['thephx.app', 'dnzvtathfpjelffjnqrc.supabase.co'],
  },
  ios: { contentInset: 'automatic' },
};
export default config;
```

```bash
npx cap add ios
npx cap add android
```

## Background audio — the whole point

### iOS (Xcode)
1. `npx cap open ios`
2. Target → Signing & Capabilities → **+ Capability → Background Modes**
3. Check **Audio, AirPlay, and Picture in Picture**

That single capability is what Safari can never grant a web page: the OS keeps
the audio session alive when the screen locks or the user switches apps. The
Media Session code already in `app.html` then drives the lock-screen controls
natively.

### Android
Add to `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```
Chrome's WebView + the existing Media Session API handles most cases; for a
guaranteed foreground media service later, add the community plugin
`capacitor-music-controls-plugin` or move playback native.

## Push notifications (upgrade path)

The current web push (VAPID) works in the Android shell as-is. iOS shells must
use APNs instead: add `@capacitor/push-notifications`, register the token into
`push_subscriptions` with a `platform` column, and extend the `send-push` edge
function to fan out via APNs (or swap both platforms to OneSignal/FCM — one
API for both, free tier is generous).

## Store checklist

- [ ] Apple Developer account ($99/yr) — enroll as the LLC once approved
- [ ] Google Play Console ($25 one-time)
- [ ] 1024×1024 app icon + splash (replace the murkmerch placeholder URLs)
- [ ] Privacy policy URL → https://thephx.app/legal (already live)
- [ ] App Privacy questionnaire: collects email, usage data (streams/likes), no tracking across apps
- [ ] Screenshots: 6.7" + 5.5" iPhone, tablet optional
- [ ] Age rating: 12+ (user-generated content with moderation + report flow — both already built, Apple checks for them)
- [ ] Apple guideline 3.1.1 note: subscriptions purchased on the web are fine (Spotify model) as long as the iOS app doesn't *link out* to purchase; show tiers read-only in-app or use In-App Purchase later

## When to go further than a shell

If store reviewers push back on the remote shell, or offline playback becomes a
feature, graduate to bundling the web assets in-app (`webDir` pointing at a
build of the real files, `server.url` removed) with Capacitor Live Updates
(Appflow or self-hosted) for OTA content. Same code, more setup.
