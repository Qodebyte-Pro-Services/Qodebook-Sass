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

   const extension = filename.split('.').pop().toLowerCase();
   const rawFileTypes = ['pdf', 'doc', 'docx', 'txt', 'csv', 'zip'];


  let resourceType = 'image';
    let publicId = `${safeName}_${uniqueSuffix}`;
    
  if (rawFileTypes.includes(extension)) {
    resourceType = 'raw';
     publicId = `${safeName}_${uniqueSuffix}.${extension}`;
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {   
        resource_type: resourceType, 
        public_id: publicId, 
        type: 'upload',
        access_mode: 'public',
        overwrite: false
       },
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
           resource_type: resourceType,
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

  const deleteFileFromCloudinary = async (publicId) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        return reject(new Error(`Cloudinary delete failed: ${error.message || error}`));
      }
      if (result.result !== "ok" && result.result !== "not found") {
        return reject(new Error(`Unexpected Cloudinary delete result: ${result.result}`));
      }
      resolve(result);
    });
  });
};

const ComplexDeleteFileFromCloudinary = async (publicId) => {
  if (!publicId) throw new Error("Missing Cloudinary publicId.");

  try {
   
    let result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });

    
    if (['not found', 'error'].includes(result.result)) {
      result = await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    }

    
    if (['not found', 'error'].includes(result.result)) {
      result = await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
    }

    
    if (!['ok', 'not found'].includes(result.result)) {
      throw new Error(`Unexpected Cloudinary delete result: ${result.result}`);
    }

    return {
      success: result.result === 'ok',
      message: result.result === 'ok' ? 'Deleted successfully' : 'File not found',
      result
    };
  } catch (error) {
    console.error("❌ Cloudinary delete failed:", error.message);
    throw new Error(`Cloudinary delete failed: ${error.message}`);
  }
};


module.exports = {
  uploadToCloudinary,
  uploadFilesToCloudinary,
  deleteFileFromCloudinary,
  ComplexDeleteFileFromCloudinary,
};
