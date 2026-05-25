const multer = require('multer');
const path = require('path');

// Configure local storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', '..', 'public', 'uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

exports.uploadFiles = upload.array('images', 10);
exports.uploadFiles2 = upload.fields([{ name: 'image', maxCount: 1 }, { name: 'banner', maxCount: 1 }]);
exports.uploadSubcategoryImage = upload.single('image');
exports.uploadImage = upload.single('image');
exports.uploadComboFiles = upload.array('images', 5);
exports.deleteImageFromS3 = async (images) => { return; };

exports.upload = upload;
