# Outfit Pilot - AJZJC

## Project Idea

OutfitPilot is an AI-assisted outfit selection application designed to reduce decision fatigue by recommending clothing combinations based on weather, user preferences, and occasion.

## Repository Structure

Within the app folder and the server folder there are README.md files that will help explain how to get each part working.
The bare minimum required to run the entire project is a **postgres database**, a **node.js** server, and a **phone** or **emulator**.

All APKs that are built on github are connected to a production server. If that server is now offline you will have to build the app yourself and point it to your server.

**WARNING:** Some parts of the server may not work properly if you are hosting locally. 

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

## Team Roster

Ammanuel Gerena — Team Lead / Backend Developer<br>
Josiah Snyder — Frontend Developer<br>
Zairon White — UI/UX Designer<br>
Jacob Whittington — API & Integration Developer<br>
Cung Thawng — Database Engineer

Meeting Times
Scrum Meeting held every Friday, in person, at 2:10pm - 2:30pm.
Follow up Scrum Meetings held every Monday, via zoom, at 6:15pm - 6:35pm

Zoom Link: https://unt.zoom.us/j/87359564014
Meeting ID: 873 5956 4014
Final Presentation May 1st, 2026 @ 1145am