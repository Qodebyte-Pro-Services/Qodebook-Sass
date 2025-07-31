const { v4: uuidv4 } = require('uuid');
const bucket = require('../config/firebase');

const uploadToFirebase = async (file) => {
  const filename = `${Date.now()}_${file.originalname}`;
  const fileRef = bucket.file(filename);
  const uuid = uuidv4();

  await fileRef.save(file.buffer, {
    metadata: {
      contentType: file.mimetype,
      metadata: {
        firebaseStorageDownloadTokens: uuid,
      },
    },
  });

  const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filename)}?alt=media&token=${uuid}`;
  return url;
};

module.exports = uploadToFirebase;