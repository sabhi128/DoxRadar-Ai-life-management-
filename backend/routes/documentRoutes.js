const express = require('express');
const router = express.Router();
const {
    uploadDocument,
    getDocuments,
    deleteDocument,
    getDocumentInsights,
    deleteAllDocuments,
} = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Configure Multer Storage (Memory for Supabase Upload)
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    },
});

// Check File Type
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|csv|txt|text/;
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
router.route('/delete-all').delete(protect, deleteAllDocuments);
router.route('/:id').delete(protect, deleteDocument);
router.route('/:id/insights').get(protect, getDocumentInsights);

module.exports = router;
