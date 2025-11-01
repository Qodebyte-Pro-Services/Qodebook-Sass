const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
 
  if (file.fieldname === 'photo') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Photo must be an image!'), false);
    }
  }
  
  else if (file.fieldname === 'documents') {
    if (
      file.mimetype.startsWith('image/') ||
      file.mimetype === 'application/pdf' ||
      file.mimetype ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
      file.mimetype === 'application/msword' 
    ) {
      cb(null, true);
    } else {
      cb(new Error('Documents must be images or PDFs/DOCXs!'), false);
    }
  } else {
    cb(new Error('Unexpected field uploaded!'), false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
