import express from 'express';
import multer from 'multer';
import {
  uploadFiles,
} from '../controllers/user/userController';

const upload = multer();
const uploads = upload.fields([{ name: 'file', maxCount: 10 }]);

const router = express.Router();

//= ===============================
// API routes
//= ===============================
router.post(
  '/uploadImg',
  uploads,
  uploadFiles,
);

module.exports = router;
