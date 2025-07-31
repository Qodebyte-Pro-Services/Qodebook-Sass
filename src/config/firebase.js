require('dotenv').config();
const admin = require('firebase-admin');

const serviceAccount = require('./firebaseServiceAccountKey.json');


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'relax-4b278.appspot.com',
});

const bucket = admin.storage().bucket();
module.exports = bucket;
