const express = require('express');
const PfeController = require('../controllers/pfe-controller');

const router = express.Router();

// define routes
router.get('/', PfeController.index);
router.post('/news', PfeController.postNews);
router.post('/test', PfeController.postTest);
router.get('/iframe', PfeController.iframe);

module.exports = router;
