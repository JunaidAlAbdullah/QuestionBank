const express = require('express');
const { list } = require('../controllers/semesters.controller');

const router = express.Router();
router.get('/', list);

module.exports = router;
