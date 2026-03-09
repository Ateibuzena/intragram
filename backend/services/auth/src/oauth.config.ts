export const OAuthConfig = {
  clientId: process.env.OAUTH_42_CLIENT_ID || '',
  clientSecret: process.env.OAUTH_42_CLIENT_SECRET || '',
  redirectUri: process.env.OAUTH_42_REDIRECT_URI || 'http://localhost:3000/auth/42/callback',
  authorizationUrl: 'https://api.intra.42.fr/oauth/authorize',
  tokenUrl: 'https://api.intra.42.fr/oauth/token',
  userInfoUrl: 'https://api.intra.42.fr/v2/me',
  scope: 'public',
};
