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

### Implemented (with Mock Data)
- **Camera Interface**: Capture photos for use in tips.
- **Tip Viewing**: A chat-style list of incoming tips from other users.
- **Ephemeral Logic**: Tips are marked as viewed and filtered from the list if they are expired.

### Planned
- **Full Firebase Integration**: Real-time sending, receiving, and storage of tips.
- **Friend Management**: Ability to search, add, and manage friends.
- **Story System**: Post 24-hour ephemeral stories visible to friends.
- **Group Chats**: Create and participate in group discussions.
- **Push Notifications**: Real-time alerts for new tips and messages.

## Getting Started

### Prerequisites

- Node.js (LTS version recommended)
- Git
- Genymotion (with VirtualBox)
- Android Studio (for Android SDK tools)

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

3.  **Set up environment variables:**
    - Create a copy of the example environment file:
      ```bash
      cp .env.example .env
      ```
    - Open the newly created `.env` file and fill in the values with your Firebase project's configuration. You can find these credentials in your [Firebase project console](https://console.firebase.google.com/).

### Running the Application

1.  **Start the development server:**
    ```bash
    npm start
    ```
    This will start the Metro bundler and open the Expo DevTools in your browser.

2.  **Open the app:**
    - **On a physical device:** Install the **Expo Go** app from the App Store or Google Play. Scan the QR code shown in the terminal or browser to open the project.
    - **On an Android Emulator:** Press `a` in the terminal where the server is running. (Requires Android Studio and a configured Android Virtual Device).
    - **On an iOS Simulator:** Press `i` in the terminal where the server is running. (Requires Xcode on macOS).

This will install the Expo Go app on your Genymotion device and run TheMarketIndex. 