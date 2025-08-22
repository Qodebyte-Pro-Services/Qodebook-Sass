const cloudinary = require('cloudinary').v2;
const { v4: uuidv4 } = require('uuid');

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  throw new Error('Cloudinary config missing: Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env');
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

const sanitizeFilename = (name) => {
  return name
    .replace(/\.[^/.]+$/, "")       
    .replace(/[^a-zA-Z0-9_-]/g, "_") 
    .toLowerCase();
};

const uploadToCloudinary = async (fileBuffer, filename) => {
  const safeName = sanitizeFilename(filename);
  const uniqueSuffix = uuidv4();
  const publicId = `${safeName}_${uniqueSuffix}`;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'image', public_id: publicId, overwrite: false },
      (error, result) => {
        if (error) {
          return reject(new Error(`Cloudinary upload failed: ${error.message || error}`));
        }
        if (!result || !result.secure_url) {
          return reject(new Error('Cloudinary upload did not return a secure_url.'));
        }
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
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
