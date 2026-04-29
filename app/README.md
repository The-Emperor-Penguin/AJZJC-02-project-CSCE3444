# OutfitPilot Mobile App

**Please Read DOCS.md before making any changes**

## Get Started

1. Install dependencies

```bash
   npm install
```

2. Ensure you are connected to the server (Railway)

3. Start the app for development

```bash
   npx expo start
```

In the output, you'll find options to open the app in Android, iOS, and web. It is recommended to use the Expo Go app on your phone or an iOS simulator for testing.

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go)

## Running Unit Tests

```bash
cd app
npm test
```

All tests are located in the `__tests__` folder and run using Jest.

## Developer Info

### Code Structure

All frontend code is within the `app` folder. All backend code is within the `server` folder. Do not change the project structure without first proposing the change and getting approval during a scrum meeting.

**WARNING**: Anything you add to the .env will be **PUBLIC**. Do not add any secrets to the .env. Server secrets go in the Railway environment variables.

### Frontend Files (app/)

- `index.tsx` — Root of the project, registers all screens and navigation
- `Authentication.tsx` — Login, create account, forgot password, reset password screens
- `Recommendations.tsx` — Today's outfit recommendations based on weather and calendar events
- `Closet.tsx` — Closet screen, clothing item screen, add clothing modal, edit clothing screen
- `Laundry.tsx` — Displays all clothing items marked as dirty
- `History.tsx` — Outfit history screen with Wear Again feature
- `Settings.tsx` — App settings including dark mode and formality preference
- `Profile.tsx` — User profile screen
- `Theme.tsx` — Dark mode and color palette support
- `AppStorage.tsx` — Secure storage for auth tokens and insecure storage for theme settings
- `utils.tsx` — Shared utility functions including camera permissions and picker tag mapping

### Backend Files (server/)

- `server.js` — Express server setup, auth routes, email reset via Resend
- `db.js` — SQLite database setup and schema
- `authController.js` — Registration, login, forgot password logic
- `authRoutes.js` — Auth API routes
- `clothingRoutes.js` — Clothing CRUD, photo upload, GPT-4o auto-tagging
- `outfitHistoryController.js` — Outfit recommendation engine, history tracking
- `outfitRoutes.js` — Outfit API routes
- `authRequired.js` — JWT middleware