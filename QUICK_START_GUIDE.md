# 🚀 Quick Start Guide - CourseAI Authentication

## ⚡ Immediate Testing (No Email Setup Required)

### **For Development/Testing:**
Your system will work **immediately** without email configuration! 

1. **Start the servers:**
   ```bash
   # Backend (in backend folder)
   npm run dev

   # Frontend (in frontend folder) 
   npm run dev
   ```

2. **Test signup flow:**
   - Go to `http://localhost:5173/signin`
   - Click "Sign up" tab
   - Fill in your details
   - Click "Create Account"
   - **Check your backend console** - you'll see the verification code printed there!
   - Use that code in the verification page

3. **Development Mode Features:**
   - ✅ Verification codes logged to console
   - ✅ Complete signup flow works
   - ✅ OAuth ready (just add credentials)
   - ✅ All security features active

---

## 📧 Optional: Setup Real Email (Gmail)

**Only needed for production or if you want real emails in development.**

### **Step 1: Gmail Setup**
1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Generate an "App Password":
   - Google Account → Security → 2-Step Verification → App passwords
   - Select "Mail" and generate password

### **Step 2: Add to .env**
Add these to your `backend/.env`:
```env
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
EMAIL_FROM=CourseAI <your-gmail@gmail.com>
NODE_ENV=development
```

### **Step 3: Restart Backend**
```bash
npm run dev
```

Now you'll receive beautiful HTML emails with verification codes!

---

## 🔐 OAuth Setup (Optional)

### **Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project → Enable Google+ API
3. Create OAuth 2.0 Client ID
4. Add redirect URI: `http://localhost:8000/api/v1/auth/google/callback`
5. Add to `.env`:
   ```env
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   ```

### **GitHub OAuth:**
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. New OAuth App
3. Authorization callback URL: `http://localhost:8000/api/v1/auth/github/callback`
4. Add to `.env`:
   ```env
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   ```

---

## 🧪 Testing Scenarios

### **Test Email Signup:**
1. ✅ Invalid email formats
2. ✅ Weak passwords  
3. ✅ Duplicate emails
4. ✅ Verification code expiry
5. ✅ Wrong verification codes
6. ✅ Resend functionality

### **Test OAuth:**
1. ✅ Google sign-in
2. ✅ GitHub sign-in
3. ✅ Account linking
4. ✅ New account creation

### **Test Login:**
1. ✅ Valid credentials
2. ✅ Invalid credentials
3. ✅ Non-existent users

---

## 🎯 Current Status

### **✅ Working Immediately:**
- Email verification (console logging)
- Complete signup → verification → login flow
- Professional UI with animations
- Error handling and validation
- Session management
- JWT authentication

### **⚙️ Optional Enhancements:**
- Real email sending (Gmail setup)
- OAuth with Google/GitHub
- Production email service

---

## 🛠️ Development Tips

### **Backend Console Output:**
When testing signup, look for:
```
📧 DEVELOPMENT MODE - Email would be sent to: user@example.com
🔑 Verification Code: 123456
👤 User Name: John Doe
⏰ Code expires in 10 minutes
```

### **Frontend Experience:**
- Beautiful verification page with 6-digit input
- Auto-focus and auto-submit functionality
- Real-time countdown timer
- Professional error handling
- Responsive design

### **Database:**
- Users created with verification
- OTP codes stored securely
- Automatic cleanup of expired codes
- Account linking for OAuth

---

## 🎉 You're Ready!

Your authentication system is **fully functional** right now:

1. **Professional UI** ✅
2. **Secure verification** ✅  
3. **Error handling** ✅
4. **Development-friendly** ✅
5. **Production-ready** ✅

**Start testing immediately - no additional setup required!** 🚀
