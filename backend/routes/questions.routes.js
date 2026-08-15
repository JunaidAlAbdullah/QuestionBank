const express = require('express');
const {
  list, getById, create, update, remove, download, downloadFile,
  toggleBookmark, toggleBlessing, report, myQuestions, myBookmarks,
} = require('../controllers/questions.controller');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

router.get('/mine', requireAuth, myQuestions);
router.get('/bookmarks/mine', requireAuth, myBookmarks);

router.get('/', optionalAuth, list);
router.get('/:id', optionalAuth, getById);
router.post('/', requireAuth, upload.array('files', 3), create);
router.put('/:id', requireAuth, upload.array('files', 3), update);
router.delete('/:id', requireAuth, remove);

router.get('/:id/download', download);
router.get('/:id/files/:fileId/download', downloadFile);
router.post('/:id/bookmark', requireAuth, toggleBookmark);
router.post('/:id/blessing', requireAuth, toggleBlessing);
router.post('/:id/report', requireAuth, report);

module.exports = router;
