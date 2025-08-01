// const passport = require('passport');
// const FacebookStrategy = require('passport-facebook').Strategy;
// const pool = require('../config/db');
// const jwt = require('jsonwebtoken');


// function configureFacebookStrategy() {
//   passport.use(new FacebookStrategy({
//     clientID: process.env.FACEBOOK_APP_ID,
//     clientSecret: process.env.FACEBOOK_APP_SECRET,
//     callbackURL: process.env.FACEBOOK_CALLBACK_URL,
//     profileFields: ['id', 'emails', 'name', 'picture.type(large)']
//   }, async (accessToken, refreshToken, profile, done) => {
//     try {
//       const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
//       if (!email) return done(null, false, { message: 'No email from Facebook.' });
//       let userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
//       let user;
//       if (userResult.rows.length === 0) {
//         const insertUserQuery = `INSERT INTO users (first_name, last_name, email, is_social_media, is_verified) VALUES ($1, $2, $3, $4, $5) RETURNING *`;
//         userResult = await pool.query(insertUserQuery, [profile.name.givenName, profile.name.familyName, email, true, true]);
//         user = userResult.rows[0];
//       } else {
//         user = userResult.rows[0];
//       }
//       if (!user.is_verified) {
//         await pool.query('UPDATE users SET is_verified = true WHERE id = $1', [user.id]);
//       }
//       return done(null, user);
//     } catch (err) {
//       return done(err, null);
//     }
//   }));
// }

// module.exports = { configureFacebookStrategy };
