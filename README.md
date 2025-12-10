# 🎓 Kids Learn

An interactive educational app for children to learn the alphabet through tracing, sound matching, and speech recognition.

Built with **Expo** and **React Native**.

---

## ✨ Features

### 📝 Trace Letter
Practice writing the alphabet by tracing letters on screen.
- Interactive SVG letter paths for all 26 letters (A-Z)
- Real-time stroke validation
- Progress persistence with AsyncStorage
- Visual feedback animations for success/failure

### 🎧 Sound Quiz
Match phonetic sounds to their corresponding letters.
- Audio playback for each letter sound
- Multiple choice answers with 4 options
- Instant visual feedback (correct/incorrect)
- Progress tracking through all 26 letters

### 🎤 Speak the Letter
Practice pronunciation using AI-powered speech recognition.
- Voice recording with microphone
- Real-time speech-to-text using AssemblyAI
- Pronunciation validation and feedback
- Progress tracking across sessions

### 🏆 Points & Rewards System
- Earn points for completing activities
- Persistent score tracking with Zustand + AsyncStorage
- Visual points badge displayed on home screen
- Reward animations for achievements

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [Expo Go](https://expo.dev/client) app installed on your phone

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/kids-learning-app.git
   cd kids-learning-app
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your API key:
   ```
   EXPO_PUBLIC_ASSEMBLYAI_API_KEY=your_api_key_here
   ```
   
   > Get your free API key from [AssemblyAI](https://www.assemblyai.com/)

---

## 📱 Running in Expo Go

1. **Start the development server**
   ```bash
   npx expo start
   ```

2. **Open the app on your device**

   **On Android:**
   - Open the **Expo Go** app
   - Tap "Scan QR code"
   - Scan the QR code shown in your terminal

   **On iPhone:**
   - Open the **Camera** app
   - Point it at the QR code in your terminal
   - Tap the notification that appears to open in Expo Go

3. **Alternative: Run on emulator/simulator**
   - Press `a` in the terminal to open on Android emulator
   - Press `i` in the terminal to open on iOS simulator

---

## 📁 Project Structure

```
kids-learning-app/
├── app/                    # Expo Router navigation
│   ├── _layout.js          # Root layout configuration
│   ├── index.js            # Home route
│   ├── trace.js            # Trace letter route
│   ├── quiz.js             # Sound quiz route
│   └── speak.js            # Speak letter route
│
├── screens/                # Screen components
│   ├── HomeScreen.jsx      # Main menu with activity cards
│   ├── TraceScreen.js      # Letter tracing game
│   ├── SoundQuizScreen.jsx # Audio matching quiz
│   └── SpeakLetterScreen.jsx # Speech recognition activity
│
├── components/             # Reusable UI components
│   ├── AlphabetSVG.js      # SVG letter paths for tracing
│   ├── PointsBadge.jsx     # Points display component
│   └── RewardAnimation.jsx # Celebration animation overlay
│
├── store/                  # State management
│   └── pointsStore.js      # Zustand store for points
│
├── utils/                  # Helper functions
│   └── audioPlayer.js      # Audio playback utilities
│
└── assets/                 # Static assets
    └── sounds/             # Letter sounds (A.mp3 - Z.mp3)
```

---

## 🎵 Audio Assets

Place the following audio files in `assets/sounds/`:

| File | Description |
|------|-------------|
| `A.mp3` - `Z.mp3` | Individual letter phonetic sounds |
| `success.mp3` | Positive feedback sound effect |
| `wrong.mp3` | Incorrect answer sound effect |

---

## 🛠️ Tech Stack

- **Expo** - React Native development platform
- **Expo Router** - File-based navigation
- **Expo Audio** - Audio recording & playback
- **React Native** - Cross-platform mobile framework
- **Zustand** - Lightweight state management
- **AsyncStorage** - Persistent local storage
- **React Native SVG** - SVG rendering for letter paths
- **AssemblyAI** - Speech-to-text API

---

## 📜 Available Scripts

```bash
npm start          # Start Expo development server
npm run android    # Run on Android device/emulator
npm run ios        # Run on iOS device/simulator
npm run web        # Run in web browser
```

---

## 🏗️ Building for Production

This project uses [EAS Build](https://docs.expo.dev/build/introduction/) for creating production builds.

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

---

## 📄 License

This project is licensed under the **0BSD License**.

---

Made with ❤️ for little learners
