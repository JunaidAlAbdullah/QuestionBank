const express = require('express');
const { list } = require('../controllers/faculties.controller');

const router = express.Router();
router.get('/', list);

module.exports = router;
