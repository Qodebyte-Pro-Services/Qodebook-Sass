
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verifies a Google ID token and returns user info if valid
 * @param {string} idToken - Google ID token from frontend
 * @returns {Promise<{ email: string, firstName: string, lastName: string, picture: string }|null>}
 */
async function verifyGoogleToken(idToken) {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    return {
      email: payload.email,
      firstName: payload.given_name,
      lastName: payload.family_name,
      picture: payload.picture,
    };
  } catch (err) {
    console.error('Google token verification failed:', err);
    return null;
  }
}

module.exports = { verifyGoogleToken };
