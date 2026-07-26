# Study Tracker

A beautiful, high-performance, responsive web application designed to help students track their daily study plans, spaced repetition revisions, and mock exams. Built using Vanilla JavaScript, HTML5, CSS3, and Firebase, this application delivers a native app-like experience right in the browser, completely offline-capable via Progressive Web App (PWA) technologies.

## ✨ Features

- **🚀 Spaced Repetition (SR) Algorithm**: Automatically tracks your study topics and suggests the Top 4 "Today Recommended" topics dynamically based on a customized SR algorithm using your self-assessed difficulty ratings (Easy, Medium, Hard).
- **📊 Advanced Statistics Dashboard**: A premium glassmorphism dashboard that calculates your completion speed, estimates remaining hours, tracks your daily streak, and predicts a highly accurate projected finish date based on your recent velocity.
- **🏆 Live Leaderboard**: Compete with peers in real-time. The leaderboard calculates your points based on syllabus coverage, completed mock exams, and consistent daily studying.
- **🎉 Gamification & Audio Feedback**: Stay motivated with satisfying, low-latency synthesized audio chimes for checking off tasks, and a massive confetti celebration when you complete all of your daily pending tasks.
- **🌙 Premium UI / Glassmorphism**: Stunning, responsive interface featuring dynamic hover effects, smooth transitions, soft shadows, and native Dark Mode / AMOLED mode support.
- **📱 PWA & Offline Support**: Install it directly to your home screen on iOS, Android, Windows, or Mac. It runs lightning fast and can cache assets for offline access using service workers.
- **☁️ Firebase Realtime Sync**: Your study progress is instantly synced to the cloud via Firebase Firestore, allowing you to seamlessly switch between your laptop and phone without losing a beat.

## 🛠️ Technology Stack

- **Frontend**: Vanilla HTML5, CSS3 (CSS Variables, Flexbox, CSS Grid), Vanilla JavaScript (ES Modules).
- **Backend/Database**: Firebase Authentication (Email/Password), Firebase Firestore (Realtime NoSQL Database).
- **PWA Capabilities**: Web App Manifest, Service Worker caching strategies.
- **Gamification API**: `canvas-confetti` library for visual celebrations, Web Audio API for synthesized, zero-latency sound effects.

## 📂 Project Structure

- `index.html`: The core of the application. Contains all markup, CSS styles, UI layout, and application logic.
- `sw.js`: The Service Worker script responsible for caching static assets and ensuring offline functionality.
- `manifest.json`: Web App Manifest defining the PWA icons, theme colors, and display modes.
- `logo.svg`: The vector graphics logo used for the application.

## 🚀 Installation & Setup

Since this is a lightweight Vanilla JS application, no build steps (like Webpack or Vite) are required!

1. Clone or download this repository.
2. Ensure you have a local HTTP server running (e.g., VS Code Live Server, or Python's `http.server`).
   *Note: Service Workers and Firebase Authentication require the app to be served over `http://localhost` or `https://`.*
3. Open `index.html` in your browser.

### Firebase Configuration
To deploy this to your own environment, you will need to replace the Firebase Config object in `index.html` with your own project credentials from the Firebase Console.
1. Create a Firebase Project.
2. Enable **Firestore Database** and **Email/Password Authentication**.
3. Replace the `firebaseConfig` block at the bottom of `index.html`.

## 🎨 Customization

The app uses an elegant set of CSS variables (`:root`) for easy theme modification:
- Modify `--blue`, `--green`, and `--accent` to change the brand colors.
- Tweak `--radius` and `--shadow` to adjust the geometry and elevation of the cards.

## 📄 License

This project is licensed under the MIT License.
