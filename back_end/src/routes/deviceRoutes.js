const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');

router.get('/', deviceController.getAllData);
module.exports = router;