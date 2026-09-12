# SQR School — Mobile App

React Native (Expo SDK 57) app for the **Teacher** and **Student** panels of the SQR School
portal. One app, one login screen: the backend decides the role and the app routes to the
matching panel — exactly like the website.

It talks to the same REST API as the web portal, with no backend changes.

## Quick start

```bash
npm install
npx expo start          # scan the QR code with Expo Go
```

The API base URL comes from `.env`:

```
EXPO_PUBLIC_API_BASE_URL=http://76.13.245.49:7979/api
```

## Release build (Android)

```bash
npx expo prebuild --platform android   # only after changing app.json / native deps
cd android && ./gradlew assembleRelease
```

The APK lands at `android/app/build/outputs/apk/release/app-release.apk`.

> The release build is signed with the template's debug keystore. Swap in a real keystore in
> `android/app/build.gradle` before shipping to the Play Store.

## Panels

| Screen | Teacher | Student | API |
| --- | --- | --- | --- |
| Login | ✅ | ✅ | `POST /v1/auth/login` → `GET /v1/profile` |
| Dashboard | ✅ | ✅ | `/v1/teacher/dashboard`, `/v1/student/dashboard` |
| Attendance | self check-in/out + class roster check-in + history | own record + history | `/v1/api/attendance/*` |
| Timetable | ✅ | today's periods on the dashboard | `/v1/weekly-timetables/teacher` |
| Homework | list, create, daily notes, delete | — | `/v1/home-work/*` |
| Holidays | ✅ | — | `/v1/holiday` |
| Messages | ✅ | ✅ | `/v1/conversations/*` |
| Profile | ✅ (logout) | ✅ (logout) | `/v1/profile`, `/v1/profile/update` |

Roles other than Teacher and Student are rejected at login with a note to use the web portal.

## Structure

```
src/
  api/            axios client + one service per controller (mirrors the portal's lib/)
  auth/           session storage (SecureStore) + AuthContext
  app/            expo-router routes
    login.tsx
    teacher/(tabs)/  dashboard · attendance · timetable · homework · profile
    teacher/         messages · chat/[id] · holidays · attendance-history/[id]
    student/(tabs)/  dashboard · attendance · messages · profile
    student/         chat/[id]
  components/     ui kit, charts, attendance calendar, messaging, dashboard panels
  theme/          colors, spacing, typography, shadows
  utils/          formatting + GPS helpers
```

## Notes

- **Auth** — the bearer token lives in SecureStore (Keychain / Android Keystore), is attached
  to every request except login, and any `401` drops the session back to the login screen.
- **Attendance** uses GPS (`expo-location`) for check-in/out, same geofence rules as the portal.
- **Chat** polls the REST endpoint every 6s while a thread is open. The portal uses STOMP over
  SockJS, which can't run inside Expo Go; the send path is the same `POST /send-message`.
- **Cleartext HTTP** is enabled for Android (`expo-build-properties`) because the API is served
  over plain HTTP. Remove it once the backend is on HTTPS.
# sqrSchoolApp
