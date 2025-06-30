# TheMarketIndex

TheMarketIndex is a production-ready mobile-first social investing platform for sharing ephemeral stock market tips, charts, and video analysis. Built with React Native (Expo) and Firebase, it enables users to share investment insights through disappearing photos and videos that expire after 24 hours.

## 🚀 Key Features

### Core Functionality
- **Enhanced Ephemeral Messaging**: Send stock market tips with photos/videos to friends or broadcast as "Signals" to all friends
- **Real Firebase Storage Integration**: Secure media upload with automatic cleanup via Cloud Functions
- **Signal Broadcasting**: Share tips with all friends simultaneously using "Send as Signal" functionality
- **Rich Tip Viewing**: Modern UI with sender profiles, media previews, and signal indicators
- **Stock Ticker Integration**: Validated stock symbol input (1-5 uppercase letters) with tip analysis
- **24-Hour Expiration**: Tips automatically expire with multi-layer cleanup system

### Social Features
- **Comprehensive Friend Management**: Add friends, send/accept requests with duplicate prevention
- **Interactive Friend Search**: Smart validation showing relationship status (Friends/Sent/Respond/Add)
- **User Profiles**: View friend profiles with remove friend functionality
- **Real-time Updates**: Live Firestore listeners for instant tip and friend updates

### Security & Performance
- **Enterprise-grade Security**: Friendship verification, server-side expiration enforcement
- **Firebase MCP Integration**: Professional configuration management with validated security rules
- **Optimized Performance**: Composite indexes for high-performance queries
- **Automatic Cleanup**: TTL policy + Cloud Functions for complete data lifecycle management

### Production-Ready Infrastructure
- **Push Notifications**: Friend request notifications via Cloud Functions with client-side fallback
- **Centralized Logging**: Structured logging service for debugging and monitoring
- **Enhanced Storage Rules**: File size limits (10MB), content type validation, user isolation
- **Professional UI**: React Native Paper components with consistent Material Design theming

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | React Native (Expo) |
| **Backend** | Firebase (Auth, Firestore, Storage, Functions) |
| **State Management** | Zustand |
| **Forms & Validation** | React Hook Form + Zod |
| **UI Components** | React Native Paper (Material Design) |
| **Navigation** | Expo Router |
| **Camera & Media** | Expo Camera, Media Library, Face Detector |
| **Push Notifications** | Expo Notifications + Cloud Functions |
| **Configuration** | Firebase MCP Tools |
| **Testing** | Jest + React Native Testing Library |

## 📱 App Structure

### Main Screens
- **Authentication** – Sign in/up with Firebase Auth
- **Home (Camera)** – Capture photos/videos with AR filters
- **Signals** – View incoming tips and signals from friends
- **Tips Modal** – Send tips to specific friends or broadcast as signals
- **Friends** – Search, add, and manage friendships
- **Account** – Profile management and settings

### Key Components
- **Enhanced Tip System** – Real Firebase Storage upload with automatic cleanup
- **Signal Broadcasting** – Send tips to all friends with one tap
- **AuthGuard** – Route protection with authentication state management
- **NotificationManager** – Push notification handling with local fallback
- **Camera Integration** – Photo/video capture with face detection for AR filters

## 🔧 Getting Started

### Prerequisites

- **Node.js** (LTS version)
- **Git**
- **iOS Simulator** (Xcode on macOS) or **Android Emulator** (Android Studio)
- **Firebase CLI** (`npm install -g firebase-tools`)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd TheMarketIndex
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Firebase Setup:**
   
   The project uses Firebase MCP integration for professional configuration management:
   
   ```bash
   # Login to Firebase
   firebase login
   
   # Set the active project
   firebase use themarketindex
   ```

4. **Environment Configuration:**

   **For Development (.env file):**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your Firebase web app credentials in `.env`:
   ```
   EXPO_PUBLIC_FIREBASE_API_KEY="your-api-key"
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
   EXPO_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app"
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
   EXPO_PUBLIC_FIREBASE_IOS_APP_ID="your-ios-app-id"
   EXPO_PUBLIC_FIREBASE_ANDROID_APP_ID="your-android-app-id"
   EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID="your-measurement-id"
   ```

   **For Production (Native Config Files):**
   ```bash
   # Download iOS configuration
   firebase apps:sdkconfig ios -o GoogleService-Info.plist
   
   # Download Android configuration  
   firebase apps:sdkconfig android -o google-services.json
   ```

### Running the Application

1. **Start the development server:**
   ```bash
   npm start
   ```

2. **Open the app:**
   - **Android Emulator**: Press `a` in the terminal
   - **iOS Simulator**: Press `i` in the terminal
   - **Physical Device**: Scan the QR code with Expo Go

## 🔐 Firebase Configuration

The project uses Firebase MCP tools for enterprise-grade configuration:

- **Project ID**: `themarketindex`
- **Security Rules**: Enhanced Firestore and Storage rules with friendship verification
- **Cloud Functions**: Automatic cleanup, push notifications, and user management
- **Performance**: Optimized composite indexes for efficient queries
- **TTL Policy**: Automatic document deletion for true ephemeral behavior

## 📝 Development Standards

- **TypeScript**: Strict mode with comprehensive type safety
- **ESLint + Prettier**: Enforced code formatting and linting
- **Structured Logging**: Centralized logging service for debugging
- **Component-First**: React Native Paper components for consistent UI
- **Theme-Driven**: Material Design theming via `useTheme` hook
- **Firebase MCP**: Professional Firebase configuration management

## 🚀 Deployment

### Cloud Functions
```bash
cd functions
npm run deploy
```

### Security Rules
```bash
firebase deploy --only firestore:rules,storage:rules
```

### Firestore Indexes
```bash
firebase deploy --only firestore:indexes
```

## 📊 Project Status

**Current Phase**: Production-Ready (Phase 1 Complete)

### ✅ Completed Features
- Enhanced tip system with real Firebase Storage integration
- Signal broadcasting to all friends
- Comprehensive friend management with search validation
- Enterprise-grade security with Firebase MCP integration
- Push notifications with Cloud Functions + client-side fallback
- Professional UI with React Native Paper
- Automatic data cleanup and TTL policies
- Performance optimization with composite indexes

### 🔄 Future Enhancements (Phase 2)
- In-app stock research and watchlists
- Premium content and subscriptions
- Advanced AR filters and effects
- Group messaging and discussions
- Enhanced analytics and insights

## 🔔 Push Notifications

**Important**: Expo Go on Android (SDK 53+) no longer supports remote push notifications.

- **Development**: Use development builds or test on iOS
- **Production**: Standalone builds support full functionality
- **Fallback**: Client-side local notifications provide immediate alerts

## 📚 Documentation

- **`_docs/PRD.md`** - Product Requirements Document
- **`_docs/DB.md`** - Firebase configuration and security rules
- **`_docs/TASKS.md`** - Implementation roadmap and task tracking
- **`_docs/STYLING.md`** - UI guidelines and React Native Paper usage

## 🤝 Contributing

1. Follow the established TypeScript and React Native patterns
2. Use React Native Paper components exclusively
3. Maintain the structured logging format
4. Test on both iOS and Android platforms
5. Update documentation for any new features

## 📄 License

This project is proprietary software. All rights reserved.

---

**Built with ❤️ for the investing community** 