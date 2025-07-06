# OAuth Setup Guide - Google & GitHub Sign-in

## 🎯 Complete OAuth Implementation

Your CourseAI application now has fully functional OAuth authentication with Google and GitHub, maintaining design consistency with your existing UI.

## ✅ **FIXED: OAuth Redirect Issue**

The OAuth flow now works exactly like your email sign-in:
- ✅ Proper database storage of user data
- ✅ Correct token generation and storage
- ✅ Seamless redirect to dashboard after authentication
- ✅ Session management with secure cookies
- ✅ Account linking for existing users

## 🔧 Backend Setup

### 1. Environment Variables

Add these to your `backend/.env` file:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here

# Session Secret for OAuth
SESSION_SECRET=your_random_session_secret_here

# Client URL for OAuth callbacks
CLIENT_URL=http://localhost:5173
```

### 2. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:8000/api/v1/auth/google/callback`
   - `https://yourdomain.com/api/v1/auth/google/callback` (for production)

### 3. GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - Application name: CourseAI
   - Homepage URL: `http://localhost:5173`
   - Authorization callback URL: `http://localhost:8000/api/v1/auth/github/callback`

## 🎨 Frontend Features

### OAuth Button Integration
- Google and GitHub sign-in buttons added to SignInPage
- Professional design matching your existing UI
- Proper loading states and error handling
- Maintains design consistency with brand colors

### Authentication Flow
- Seamless OAuth redirect handling
- Automatic token management
- Session persistence with localStorage
- User profile synchronization

## 🔗 API Endpoints

### OAuth Routes
- `GET /api/v1/auth/google` - Initiate Google OAuth
- `GET /api/v1/auth/google/callback` - Google OAuth callback
- `GET /api/v1/auth/github` - Initiate GitHub OAuth
- `GET /api/v1/auth/github/callback` - GitHub OAuth callback
- `GET /api/v1/auth/status` - Check authentication status

### User Data Handling
- Automatic user creation for new OAuth users
- Account linking for existing users with same email
- Profile data synchronization (name, email, avatar)
- Provider tracking (email, google, github)

## 🔄 **OAuth Flow Explained**

### Backend Flow:
1. **OAuth Initiation**: `/api/v1/auth/google` or `/api/v1/auth/github`
2. **User Authorization**: Redirects to OAuth provider
3. **Callback Handling**: `/api/v1/auth/google/callback` or `/api/v1/auth/github/callback`
4. **Database Operations**: Create/update user, generate JWT tokens
5. **Session Storage**: Store user data temporarily in session
6. **Cookie Setting**: Set httpOnly cookies with tokens
7. **Redirect**: Send user to frontend dashboard with success flag

### Frontend Flow:
1. **URL Detection**: Check for `?auth=success` parameter
2. **Data Retrieval**: Fetch OAuth user data from `/api/v1/auth/oauth-user`
3. **Store Update**: Update Zustand store with user data
4. **Token Storage**: Save access token to localStorage
5. **Navigation**: Automatic redirect to dashboard
6. **Cleanup**: Remove URL parameters and clear session data

## 🏗️ Implementation Details

### Backend Architecture
- **Passport.js** strategies for Google and GitHub
- **Express sessions** for OAuth state management
- **JWT tokens** for API authentication
- **MongoDB** user model with OAuth fields

### Frontend Architecture
- **Zustand** store for authentication state
- **React Router** for navigation after OAuth
- **Tailwind CSS** for consistent styling
- **Framer Motion** for smooth animations

### Security Features
- Secure cookie handling
- CSRF protection via sameSite cookies
- Token validation and refresh
- Environment-based configuration

## 🚀 Testing

1. Start backend: `npm run dev` (port 8000)
2. Start frontend: `npm run dev` (port 5173)
3. Visit `http://localhost:5173/signin`
4. Test Google and GitHub sign-in buttons

## 📱 User Experience

### Sign-in Flow
1. User clicks Google/GitHub button
2. Redirects to OAuth provider
3. User authorizes application
4. Redirects back to CourseAI dashboard
5. User is automatically signed in

### Account Management
- Users can sign in with multiple providers
- Same email = same account (linked automatically)
- Profile updates sync across providers
- Avatar automatically fetched from OAuth provider

## 🎯 Production Deployment

### Environment Variables
Update your production `.env` with:
- Real OAuth client IDs and secrets
- Production CLIENT_URL
- Secure SESSION_SECRET

### OAuth App Configuration
Update OAuth app settings with production URLs:
- Google: `https://yourdomain.com/api/v1/auth/google/callback`
- GitHub: `https://yourdomain.com/api/v1/auth/github/callback`

## ✅ Features Implemented

- [x] Google OAuth sign-in
- [x] GitHub OAuth sign-in
- [x] Professional UI design
- [x] Account linking
- [x] Session management
- [x] Error handling
- [x] Loading states
- [x] Responsive design
- [x] Dark mode support
- [x] Security best practices

Your OAuth implementation is now complete and ready for production use! 🎉
