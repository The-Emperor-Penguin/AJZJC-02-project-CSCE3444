# Outfit Pilot Mobile App


**Please Read DOCS.md before making any changes**

## Get started

1. Install dependencies

   ```bash
   npm install
   ```
2. Ensure you are connected to a server

3. Start the app for development

   ```bash
   npx expo start
   ```


In the output, you'll find options to open the app in android, ios, and web. It is recommended to start an android emulator so you can run the app in android.


- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

## Developer Info
### Code Structure
Currently all code is within the app folder. Do not change the project structure without first proposing the change and getting approval during a scrum meeting, or scheduling it for the time between sprints.
#### app folder
##### Current files

**WARNING**: Anything you add to the .env will be **PUBLIC**. Do not add any secrets to the .env.

The index file is the root of the project and should only be changed to add more screens.

The Authentication file stores all the screens and functions for authentication such as login, create account, and reset password.

The Recommendations file currently stores a placeholder that will be updated to show the current recommendations.


##### Future files
Other files that should be created are Closet which will manage the users stored clothes, also add and edit clothing. 
There also should be a file to manage the laundry workflow.
Another file should be app settings and another one for account management.