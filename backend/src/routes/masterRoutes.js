const express = require('express');
const router = express.Router();
const masterController = require('../controllers/masterController');
const { authMiddleware } = require('../middleware/authMiddleware');
router.use(authMiddleware);
router.get('/', masterController.getMasters);
router.post('/', masterController.createMaster);
router.delete('/:id', masterController.deleteMaster);
module.exports = router;