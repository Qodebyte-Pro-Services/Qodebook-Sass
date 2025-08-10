const cloudinary = require('cloudinary').v2;

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  throw new Error('Cloudinary config missing: Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env');
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});


const uploadToCloudinary = async (fileBuffer, filename) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'image', public_id: filename },
      (error, result) => {
        if (error) {
          return reject(new Error(`Cloudinary upload failed: ${error.message || error}`));
        }
        if (!result || !result.secure_url) {
          return reject(new Error('Cloudinary upload did not return a secure_url.'));
        }
        resolve(result.secure_url);
      }
    );
    stream.end(fileBuffer);
  });
};


const uploadFilesToCloudinary = async (files) => {
  if (!files) return [];

  const fileArray = Array.isArray(files) ? files : [files];
  const uploads = fileArray.map(file => uploadToCloudinary(file.buffer, file.originalname));

  return Promise.all(uploads);
};

module.exports = {
  uploadToCloudinary,
  uploadFilesToCloudinary
};
