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

### Running with Genymotion

To run the application on a Genymotion emulator, you need to ensure both Expo and Genymotion use the same Android SDK.

1.  **Configure Android SDK**:
    - Open Android Studio and go to `Settings` > `Languages & Frameworks` > `Android SDK`.
    - Note the **Android SDK Location**. You will need this path.

2.  **Configure Genymotion**:
    - Open Genymotion and go to `Settings` > `ADB`.
    - Select "Use custom Android SDK tools".
    - Set the SDK path to the **Android SDK Location** you noted from Android Studio.

3.  **Start the Emulator**:
    - In Genymotion, start your desired virtual device.

4.  **Run the App**:
    - In your project's root directory, start the Expo development server:
      ```bash
      npm start
      ```
    - In the terminal where the server is running, press `a` to open the app on your running Android emulator.

This will install the Expo Go app on your Genymotion device and run TheMarketIndex. 