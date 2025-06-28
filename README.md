# TheMarketIndex

TheMarketIndex is a mobile-first social investing platform for sharing and discussing stock market tips, charts, and video analysis through ephemeral messaging. Built with a modern React Native stack, it provides a fast, real-time experience for users to share investment insights that expire over time.

## Tech Stack

- **Framework**: React Native (via Expo)
- **Backend & Real-time DB**: Firebase (Auth, Firestore, Storage, Functions)
- **State Management**: Zustand
- **Forms**: React Hook Form with Zod for validation
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Navigation**: Expo Router
- **Camera & Media**: Expo Camera, Expo Media Library
- **Testing**: Jest & React Native Testing Library

## Features

### Implemented
- **Firebase Integration**: Core services for auth, storage, and database are connected.
- **Snap Sending**: Users can send photo snaps, which are uploaded to Firebase.
- **Camera Interface**: Capture photos for use in tips.
- **Friend Management**: Users can search for other users by name.
- **Tip Viewing**: A chat-style list of incoming tips from other users.
- **Ephemeral Logic**: Tips are marked as viewed and filtered from the list if they are expired.
- **Centralized Logging**: A structured logging service is in place to monitor authentication and navigation events.

### Planned
- **Full Friend Management**: Implement friend requests (add/accept), and display a friends list.
- **Story System**: Post 24-hour ephemeral stories visible to friends.
- **Group Chats**: Create and participate in group discussions.
- **Push Notifications**: Real-time alerts for new tips and messages.

## Getting Started

### Prerequisites

- Node.js (LTS version recommended)
- Git
- An iOS simulator (via Xcode on macOS) or an Android emulator (via Android Studio).

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd TheMarketIndex
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables & Firebase Configuration:**

    This project uses both a `.env` file for web/Expo Go development and native configuration files (`google-services.json` and `GoogleService-Info.plist`) for native builds.

    - **Create the `.env` file:**
      - Copy the example file:
        ```bash
        cp .env.example .env
        ```
      - Open the new `.env` file and populate it with your Firebase project's web app credentials. You can find these in your **Firebase project settings > General > Your apps > Web app**.

        ```
        EXPO_PUBLIC_FIREBASE_API_KEY=""
        EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=""
        EXPO_PUBLIC_FIREBASE_PROJECT_ID=""
        EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=""
        EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=""
        EXPO_PUBLIC_FIREBASE_IOS_APP_ID=""
        EXPO_PUBLIC_FIREBASE_ANDROID_APP_ID=""
        EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=""
        ```

    - **Download Native Firebase Configuration:**
      - Make sure you have the [Firebase CLI](https://firebase.google.com/docs/cli) installed and are logged in (`firebase login`).
      - Run the following commands to download the native configuration files. Replace `<app-id>` with your actual Firebase App ID for iOS and Android respectively.

        *For iOS:*
        ```bash
        firebase apps:sdkconfig -i <app-id> -o GoogleService-Info.plist
        ```
        *For Android:*
        ```bash
        firebase apps:sdkconfig -a <app-id> -o google-services.json
        ```

### Running the Application

1.  **Start the development server:**
    ```bash
    npm start
    ```

2.  **Open the app:**
    - **On an Android Emulator:** With the emulator running, press `a` in the terminal where the server is running.
    - **On an iOS Simulator:** With the simulator running, press `i` in the terminal where the server is running.

This will install the Expo Go app on your Genymotion device and run TheMarketIndex. 