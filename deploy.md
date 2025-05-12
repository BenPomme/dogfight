# Space Dogfight Deployment Guide

## Firebase Setup

### Prerequisites
- Node.js (v18 or later)
- npm (comes with Node.js)
- Firebase CLI (`npm install -g firebase-tools`)

### Initial Setup
1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase in the project:
```bash
firebase init
```
Select the following options:
- Hosting
- Functions (if needed)
- Storage (if needed)
- Firestore (if needed)
- Realtime Database (if needed)

### Realtime Database Setup
1. Initialize Realtime Database in test mode:
```bash
firebase init database
```

2. Create a `realtime-db.js` file in your project:
```javascript
import { getDatabase, ref, set, get, onValue, off, push, remove } from "firebase/database";
import { app } from './firebase';

const db = getDatabase(app);

// Example real-time subscription
export const subscribeToGameState = (gameId, callback) => {
  const gameRef = ref(db, `games/${gameId}`);
  onValue(gameRef, (snapshot) => {
    const data = snapshot.val();
    callback(data);
  });
  return () => off(gameRef);
};

// Example real-time update
export const updateGameState = async (gameId, gameData) => {
  try {
    await set(ref(db, `games/${gameId}`), {
      ...gameData,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error("Error updating game state:", error);
    return false;
  }
};

export { db };
```

3. Realtime Database Rules (in `database.rules.json`):
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

### Firestore Setup
1. Initialize Firestore in test mode:
```bash
firebase init firestore
```

2. Create a `firestore.js` file in your project:
```javascript
import { getFirestore, collection, doc, setDoc, getDoc, getDocs } from "firebase/firestore";
import { app } from './firebase';

const db = getFirestore(app);

// Example functions for game data
export const saveGameState = async (gameId, gameData) => {
  try {
    await setDoc(doc(db, "games", gameId), gameData);
    return true;
  } catch (error) {
    console.error("Error saving game state:", error);
    return false;
  }
};

export const getGameState = async (gameId) => {
  try {
    const docRef = doc(db, "games", gameId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error("Error getting game state:", error);
    return null;
  }
};

export const getAllGames = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "games"));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting all games:", error);
    return [];
  }
};

export { db };
```

3. Firestore Security Rules (in `firestore.rules`):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Test mode - allow all reads and writes
    match /{document=**} {
      allow read, write: if true;
    }
    
    // TODO: Implement proper security rules before production
    // Example of production rules:
    // match /games/{gameId} {
    //   allow read: if request.auth != null;
    //   allow write: if request.auth != null && request.auth.uid == resource.data.userId;
    // }
  }
}
```

### Environment Configuration
1. Create a `.env` file in the project root:
```bash
touch .env
```

2. Add the following environment variables:
```env
FIREBASE_API_KEY=AIzaSyANo04W9TxWKV-zK4U_Mx4JqENkU7OexQw
FIREBASE_AUTH_DOMAIN=dogfight-3ae8b.firebaseapp.com
FIREBASE_PROJECT_ID=dogfight-3ae8b
FIREBASE_STORAGE_BUCKET=dogfight-3ae8b.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=290038651724
FIREBASE_APP_ID=1:290038651724:web:ce0cdddbddaa962f544de9
FIREBASE_MEASUREMENT_ID=G-ME7E5PHHP8
OPENAI_API_KEY=your_openai_api_key
```

3. Add `.env` to `.gitignore`:
```bash
echo ".env" >> .gitignore
```

### Firebase Configuration
Create a `firebase.js` file in your project:

```javascript
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
```

### Deployment

1. Build the project:
```bash
npm run build
```

2. Deploy to Firebase (including database rules):
```bash
firebase deploy
```

### CI/CD Setup

The project uses GitHub Actions for continuous deployment. The workflow is configured in `.github/workflows/deploy.yml`.

### Security Considerations

1. Never commit API keys or sensitive credentials to the repository
2. Use environment variables for all sensitive data
3. Implement proper security rules in Firebase
4. Set up proper CORS policies
5. Enable Firebase Authentication if needed
6. Configure Firebase Security Rules for Firestore and Storage
7. Update Firestore security rules before moving to production
8. Implement proper data validation in Firestore rules
9. Update Realtime Database rules before moving to production
10. Implement proper data validation in Realtime Database rules

### Monitoring

1. Set up Firebase Analytics
2. Configure error reporting
3. Monitor performance metrics
4. Set up alerts for critical issues
5. Monitor Firestore usage and quotas
6. Set up Firestore backup strategy
7. Monitor Realtime Database usage and quotas
8. Set up Realtime Database backup strategy

### Backup and Recovery

1. Regular database backups
2. Version control for configuration
3. Document recovery procedures
4. Maintain deployment history
5. Implement Firestore data export strategy
6. Document Firestore recovery procedures
7. Implement Realtime Database data export strategy
8. Document Realtime Database recovery procedures

## Troubleshooting

### Common Issues

1. Build Failures
   - Check Node.js version
   - Verify all dependencies are installed
   - Check for syntax errors

2. Deployment Failures
   - Verify Firebase CLI is installed
   - Check Firebase project configuration
   - Verify environment variables
   - Check Firestore rules syntax
   - Check Realtime Database rules syntax

3. Runtime Errors
   - Check Firebase console for errors
   - Verify API keys and configuration
   - Check network connectivity
   - Monitor Firestore quota usage
   - Check Firestore security rules
   - Monitor Realtime Database quota usage
   - Check Realtime Database security rules

### Support

For deployment issues:
1. Check Firebase documentation
2. Review deployment logs
3. Contact Firebase support if needed
4. Check Firestore documentation for specific issues
5. Check Realtime Database documentation for specific issues

For Firestore issues:
1. Check Firestore documentation
2. Review Firestore usage and quotas
3. Contact Firestore support if needed

For Realtime Database issues:
1. Check Realtime Database documentation
2. Review Realtime Database usage and quotas
3. Contact Realtime Database support if needed

### Port 8080 already in use
If you see an error like `EADDRINUSE: address already in use :::8080`, kill the process using the port:

```sh
lsof -ti:8080 | xargs kill -9
```

Then restart the server:

```sh
npm start
```

### Missing script: "start"
Make sure you are in the `space-dogfight` directory before running `npm start`.

### Renderer/DOM errors
If you see errors about `WebGLRenderer` or `Cannot read properties of null`, ensure the canvas is created by Three.js and appended to the `#game-container` div. The code now handles this automatically.

Here's how the issue was fixed:
1. Created a fallback canvas with set dimensions when needed
2. Added checks to ensure DOM elements exist before accessing them
3. Made sure Three.js is imported consistently from a single source file
4. Switched from `DOMContentLoaded` to `load` event for initialization
5. Added timeouts to ensure DOM is fully ready

### Simplified Demo
For development and debugging purposes, a simplified interactive spaceship demo has been created in `index.js`. This demo:
1. Correctly initializes the WebGL renderer
2. Provides basic flight controls (WASD, Space/Shift, mouse)
3. Implements simplified physics with inertia
4. Includes a third-person camera that follows the ship

To revert to the full game implementation when ready, simply remove the simplified demo code and restore the original game initialization code.