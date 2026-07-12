# Expense Manager - React Native Expo App 💰

A comprehensive expense tracking mobile application built with React Native and Expo. This app connects to the [expense-manager-apis](https://github.com/Rubayet-hasan-yasin/expense-manager-apis) backend for managing personal finances.

## Features

- 🔐 **Authentication** - Login/Register with JWT-based authentication
- 📊 **Dashboard** - View spending summaries, category breakdowns, and monthly trends
- 💰 **Expense Management** - Create, edit, delete expenses with filtering
- 🏷️ **Category Management** - Custom categories with colors and icons
- 💱 **Multi-Currency Support** - Track expenses in USD, EUR, GBP, and more
- 👤 **Profile Management** - Update user information
- 🌙 **Dark Mode Support** - Automatic theme switching

## 📱 Android APK

Download the latest APK from:
https://github.com/Rubayet-hasan-yasin/expense-manager-expo/releases

> **Note:** Make sure to download the latest release version for the best experience and bug fixes.

## Tech Stack

- **React Native** with **Expo** (~54.0)
- **Expo Router** for file-based navigation
- **TypeScript** for type safety
- **AsyncStorage** for local data persistence
- **Ionicons** for vector icons

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Installation

1. Install dependencies

   ```bash
   npm install
   ```

2. Configure the API endpoint

   Edit `constants/api-config.ts` to point to your backend server:

   ```typescript
   // For local development
   // Android Emulator: use 10.0.2.2 instead of localhost
   // iOS Simulator: localhost works
   // Physical device: use your computer's IP address
   
   BASE_URL: 'http://localhost:3000/api/v1'
   ```

3. Start the app

   ```bash
   npx expo start
   ```

4. Open in simulator/emulator
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app for physical device

## Project Structure

```
expense-manager-expo/
├── app/                      # Expo Router screens
│   ├── (tabs)/              # Tab navigation screens
│   │   ├── index.tsx        # Dashboard
│   │   ├── expenses.tsx     # Expenses list
│   │   ├── categories.tsx   # Categories list
│   │   └── profile.tsx      # User profile
│   ├── expense/             # Expense detail screens
│   ├── category/            # Category detail screens
│   ├── login.tsx            # Login screen
│   └── register.tsx         # Register screen
├── components/              # Reusable UI components
├── constants/               # App constants and config
│   ├── api-config.ts        # API configuration
│   └── theme.ts             # Theme colors
├── contexts/                # React contexts
│   └── auth-context.tsx     # Authentication context
├── hooks/                   # Custom hooks
│   ├── use-expenses.ts      # Expenses hook
│   ├── use-categories.ts    # Categories hook
│   └── use-dashboard.ts     # Dashboard hook
├── services/                # API services
│   └── api.ts               # API client
├── types/                   # TypeScript types
│   └── index.ts             # All type definitions
└── utils/                   # Utility functions
    └── formatters.ts        # Format helpers
```

## API Integration

This app is designed to work with the [expense-manager-apis](https://github.com/Rubayet-hasan-yasin/expense-manager-apis) backend. The API provides:

- User authentication (register, login, profile)
- Expense CRUD with filtering and pagination
- Category management with colors and icons
- Dashboard analytics (summary, trends, category breakdown)

### API Endpoints Used

| Endpoint | Description |
|----------|-------------|
| `POST /auth/register` | Register new user |
| `POST /auth/login` | Login user |
| `GET /auth/profile` | Get user profile |
| `PUT /auth/profile` | Update profile |
| `GET /expenses` | List expenses (paginated) |
| `POST /expenses` | Create expense |
| `PUT /expenses/:id` | Update expense |
| `DELETE /expenses/:id` | Delete expense |
| `GET /categories` | List categories |
| `POST /categories` | Create category |
| `PUT /categories/:id` | Update category |
| `DELETE /categories/:id` | Delete category |
| `GET /dashboard/summary` | Get spending summary |
| `GET /dashboard/monthly-trends` | Get monthly trends |
| `GET /dashboard/recent-expenses` | Get recent expenses |

## Scripts

- `npm start` - Start Expo development server
- `npm run android` - Start on Android
- `npm run ios` - Start on iOS
- `npm run web` - Start on web
- `npm run lint` - Run ESLint

## Learn More

- [Expo documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Expo Router](https://expo.github.io/router/docs/)
