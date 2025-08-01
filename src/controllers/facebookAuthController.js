// const passport = require('passport');
// const jwt = require('jsonwebtoken');


// exports.facebookCallback = (req, res) => {

//   if (!req.user) {
//     return res.status(401).json({ message: 'Facebook authentication failed.' });
//   }
//   const token = jwt.sign({ user_id: req.user.id, email: req.user.email, is_social_media: true }, process.env.JWT_SECRET, { expiresIn: '7d' });
 
//   return res.status(200).json({ message: 'Facebook login successful.', token });
// };
