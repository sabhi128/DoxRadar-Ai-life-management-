const express = require('express');
const router = express.Router();
const {
    uploadDocument,
    getDocuments,
    deleteDocument,
} = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(
            null,
            file.fieldname + '-' + Date.now() + path.extname(file.originalname)
        );
    },
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    },
});

// Check File Type
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = filetypes.test(
        path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb('Error: Images and Documents Only!');
    }
}

router.route('/').get(protect, getDocuments).post(protect, upload.single('document'), uploadDocument);
router.route('/:id').delete(protect, deleteDocument);

module.exports = router;
