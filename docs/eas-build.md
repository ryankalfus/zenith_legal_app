# EAS Build + Submit

## 1) Login and Configure
```bash
cd apps/mobile
eas login
eas build:configure
```

## 2) Build iOS
```bash
eas build --platform ios --profile production
```

## 3) Build Android (optional for MVP readiness)
```bash
eas build --platform android --profile production
```

## 4) Submit iOS
```bash
eas submit --platform ios --profile production
```

## 5) Pre-submit checks
- App uses production Firebase config.
- Push notification permissions text is present.
- Delete account/data flow is accessible in app profile tab.
- Privacy policy URL and support URL are ready in App Store Connect metadata.
