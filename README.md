# Kids Learning App

New features added:
- Points & Rewards System (Zustand + AsyncStorage)
- Sound Quiz Game
- Expo Router Navigation

## Setup

1. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and add your API keys:
   - `EXPO_PUBLIC_ASSEMBLYAI_API_KEY`: Get from [AssemblyAI](https://www.assemblyai.com/)

3. Run the app:
   ```bash
   npx expo start
   ```

## Audio Assets

Please place the following audio files in `assets/sounds/`:
- `A.mp3`, `B.mp3`, ..., `Z.mp3` (Letter sounds)
- `success.mp3` (Positive feedback sound)
- `wrong.mp3` (Negative feedback sound)
- `button-3.mp3` (Existing button sound if needed, or replace usage in code)

Note: The app currently uses a placeholder or hardcoded generic sound helper. 
To fully enable dynamic audio, ensure `utils/audioPlayer.js` is updated to require your map of files, OR use the `SoundQuizScreen.jsx` logic which assumes you might need to adjust based on your exact asset strategy (e.g. `require` cannot be dynamic with variables).

## Project Structure

- `app/`: Routing files (`index`, `trace`, `quiz`).
- `components/`: Reusable UI (`PointsBadge`, `RewardAnimation`).
- `screens/`: Screen logic.
- `store/`: State management (`pointsStore`).
- `utils/`: Helpers (`audioPlayer`).
