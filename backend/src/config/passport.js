import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { User } from '../models/user.model.js';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config();

const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '');

const backendBaseUrl = trimTrailingSlash(
  process.env.BACKEND_URL ||
  process.env.RENDER_EXTERNAL_URL ||
  `http://localhost:${process.env.PORT || 8000}`
);

const sanitizeUsername = (value = '') =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '') || 'user';

const createUniqueUsername = async (preferredValue, fallbackPrefix) => {
  const baseUsername = sanitizeUsername(preferredValue || fallbackPrefix);

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate =
      attempt === 0
        ? baseUsername
        : `${baseUsername}_${Math.random().toString(36).slice(2, 8)}`;

    const existingUser = await User.findOne({ username: candidate }).select('_id');
    if (!existingUser) {
      return candidate;
    }
  }

  return `${fallbackPrefix}_${Date.now()}`;
};

const getPrimaryEmail = (profile) =>
  profile.emails?.find((entry) => entry.verified)?.value ||
  profile.emails?.[0]?.value ||
  null;

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${backendBaseUrl}/api/v1/auth/google/callback`,
      proxy: true
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('🔍 Google OAuth profile:', profile.id, profile.emails?.[0]?.value);
        const email = getPrimaryEmail(profile);

        if (!email) {
          return done(new Error('Google account did not provide an email address.'), null);
        }
        
        // Check if user already exists with Google ID
        let user = await User.findOne({ google_id: profile.id });
        
        if (user) {
          console.log('✅ Found existing Google user:', user.email);
          return done(null, user);
        }
        
        // Check if user exists with same email
        const existingUser = await User.findOne({ email });
        
        if (existingUser) {
          // Link Google account to existing user
          existingUser.google_id = profile.id;
          existingUser.provider = 'google';
          existingUser.avatar_url = profile.photos?.[0]?.value || existingUser.avatar_url;
          await existingUser.save();
          console.log('🔗 Linked Google account to existing user:', existingUser.email);
          return done(null, existingUser);
        }
        
        // Create new user
        const username = await createUniqueUsername(
          email.split('@')[0],
          `google_${profile.id}`
        );

        const newUser = await User.create({
          _id: `user_${Date.now()}_${uuidv4().substring(0, 8)}`,
          username,
          email,
          fullname: profile.displayName || 'Google User',
          google_id: profile.id,
          provider: 'google',
          avatar_url: profile.photos?.[0]?.value || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
        });
        
        console.log('✅ Created new Google user:', newUser.email);
        return done(null, newUser);
      } catch (error) {
        console.error('❌ Google OAuth error:', error);
        return done(error, null);
      }
    }
  )
);

// GitHub OAuth Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${backendBaseUrl}/api/v1/auth/github/callback`,
      proxy: true
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('🔍 GitHub OAuth profile:', profile.id, profile.emails?.[0]?.value);
        const email =
          getPrimaryEmail(profile) ||
          (profile.username ? `${profile.username}@users.noreply.github.com` : null);

        if (!email) {
          return done(new Error('GitHub account did not provide an email address.'), null);
        }
        
        // Check if user already exists with GitHub ID
        let user = await User.findOne({ github_id: profile.id });
        
        if (user) {
          console.log('✅ Found existing GitHub user:', user.email);
          return done(null, user);
        }
        
        // Check if user exists with same email
        const existingUser = await User.findOne({ email });
        
        if (existingUser) {
          // Link GitHub account to existing user
          existingUser.github_id = profile.id;
          existingUser.provider = 'github';
          existingUser.avatar_url = profile.photos?.[0]?.value || existingUser.avatar_url;
          await existingUser.save();
          console.log('🔗 Linked GitHub account to existing user:', existingUser.email);
          return done(null, existingUser);
        }
        
        // Create new user
        const username = await createUniqueUsername(
          profile.username || email.split('@')[0],
          `github_${profile.id}`
        );

        const newUser = await User.create({
          _id: `user_${Date.now()}_${uuidv4().substring(0, 8)}`,
          username,
          email,
          fullname: profile.displayName || profile.username || 'GitHub User',
          github_id: profile.id,
          provider: 'github',
          avatar_url: profile.photos?.[0]?.value || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
        });
        
        console.log('✅ Created new GitHub user:', newUser.email);
        return done(null, newUser);
      } catch (error) {
        console.error('❌ GitHub OAuth error:', error);
        return done(error, null);
      }
    }
  )
);

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password_hash -refresh_token');
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
