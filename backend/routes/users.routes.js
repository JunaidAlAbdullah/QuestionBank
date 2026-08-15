const express = require('express');
const { getPublicProfile } = require('../controllers/users.controller');

const router = express.Router();
router.get('/:username', getPublicProfile);

module.exports = router;
