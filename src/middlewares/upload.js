const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'photo') {
    // Only allow image files for staff photo
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Photo must be an image file (jpg, png, etc.)!'), false);
    }
  } 
  
  else if (file.fieldname === 'documents') {
    // Allow images, PDFs, DOCX, and DOC for staff documents
    const allowedDocs = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (file.mimetype.startsWith('image/') || allowedDocs.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Documents must be images, PDFs, or Word files!'), false);
    }
  } 
  
  else {
    cb(new Error(`Unexpected field: ${file.fieldname}`), false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
