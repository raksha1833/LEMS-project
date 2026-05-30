// routes/reportRoutes.js
const express     = require('express');
const router      = express.Router();
const ctrl        = require('../controllers/reportController');
const verifyToken = require('../middleware/auth');
const checkRole   = require('../middleware/roleCheck');

router.get('/dashboard',       verifyToken,                             ctrl.getDashboard);
router.get('/station/:id',     verifyToken, checkRole('admin','officer'), ctrl.getStationReport);

module.exports = router;
