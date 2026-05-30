// routes/firRoutes.js
const express     = require('express');
const router      = express.Router();
const ctrl        = require('../controllers/firController');
const verifyToken = require('../middleware/auth');
const checkRole   = require('../middleware/roleCheck');

router.get('/',           verifyToken,                             ctrl.getAllFIRs);
router.get('/:id',        verifyToken,                             ctrl.getFIRById);
router.post('/',          verifyToken, checkRole('admin','officer'), ctrl.createFIR);
router.put('/:id/status', verifyToken, checkRole('admin','officer'), ctrl.updateFIRStatus);

module.exports = router;
