// src/config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const { Op } = require('sequelize');
const { User, Role } = require('../models');

const BACKEND_URL = process.env.BACKEND_URL;
const FRONTEND_URL = process.env.FRONTEND_URL;

// Skip strategies with placeholder values like "...", "your_xxx", etc.
const isReal = (v) => {
  if (!v) return false;
  const s = String(v).trim();
  return s.length > 8 && !s.startsWith('...') && !s.startsWith('your_');
};

// ── Helper: find or create OAuth user 
async function findOrCreateOAuthUser({ provider, oauthId, email, firstName, lastName, avatar }) {
  // 1. Look up by provider + oauthId
  let user = await User.findOne({
    where: { oauthProvider: provider, oauthId: String(oauthId) },
    include: { association: 'Roles' },
  });

  if (!user && email) {
    // 2. Merge with existing account that has the same email
    user = await User.findOne({
      where: { email },
      include: { association: 'Roles' },
    });
    if (user) {
      await user.update({ oauthProvider: provider, oauthId: String(oauthId) });
    }
  }

  if (!user) {
    // 3. Create brand-new user
    const username = `${provider}_${oauthId}`.slice(0, 50);
    user = await User.create({
      username,
      email: email || `${provider}_${oauthId}@oauth.local`,
      password: null,
      firstName: firstName || null,
      lastName: lastName || null,
      avatar: avatar || null,
      oauthProvider: provider,
      oauthId: String(oauthId),
    });
    const defaultRole = await Role.findOne({ where: { name: 'user' } });
    if (defaultRole) await user.addRole(defaultRole);

    // Reload with roles
    user = await User.findByPk(user.id, { include: { association: 'Roles' } });
  }

  return user;
}

// ── Google ──
if (isReal(process.env.GOOGLE_CLIENT_ID) && isReal(process.env.GOOGLE_CLIENT_SECRET)) {
  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${BACKEND_URL}/api/auth/google/callback`,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const firstName = profile.name?.givenName;
        const lastName = profile.name?.familyName;
        const avatar = profile.photos?.[0]?.value;
        const user = await findOrCreateOAuthUser({ provider: 'google', oauthId: profile.id, email, firstName, lastName, avatar });
        done(null, user);
      } catch (err) { done(err, null); }
    }
  ));
}

// ── Facebook 
if (isReal(process.env.FACEBOOK_APP_ID) && isReal(process.env.FACEBOOK_APP_SECRET)) {
  passport.use(new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: `${BACKEND_URL}/api/auth/facebook/callback`,
      profileFields: ['id', 'emails', 'name', 'photos'],
      enableProof: true,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value ?? null;
        const firstName = profile.name?.givenName ?? null;
        const lastName = profile.name?.familyName ?? null;
        const avatar = profile.photos?.[0]?.value ?? null;
        const user = await findOrCreateOAuthUser({ provider: 'facebook', oauthId: profile.id, email, firstName, lastName, avatar });
        done(null, user);
      } catch (err) { done(err, null); }
    }
  ));
}

// ── GitHub 
if (isReal(process.env.GITHUB_CLIENT_ID) && isReal(process.env.GITHUB_CLIENT_SECRET)) {
  passport.use(new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${BACKEND_URL}/api/auth/github/callback`,
      scope: ['user:email'],
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const nameParts = (profile.displayName || '').split(' ');
        const firstName = nameParts[0] || null;
        const lastName = nameParts.slice(1).join(' ') || null;
        const avatar = profile.photos?.[0]?.value;
        const user = await findOrCreateOAuthUser({ provider: 'github', oauthId: profile.id, email, firstName, lastName, avatar });
        done(null, user);
      } catch (err) { done(err, null); }
    }
  ));
}

// Not using sessions — passport just needs serialize/deserialize stubs
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => done(null, { id }));

module.exports = { passport, FRONTEND_URL };
