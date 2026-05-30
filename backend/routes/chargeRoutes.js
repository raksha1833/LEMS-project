// routes/chargeRoutes.js
const express     = require('express');
const router      = express.Router();
const ctrl        = require('../controllers/chargeController');
const verifyToken = require('../middleware/auth');
const checkRole   = require('../middleware/roleCheck');

router.get('/legal-sections',    verifyToken,                             ctrl.getLegalSections);
router.get('/',                  verifyToken,                             ctrl.getCharges);
router.post('/',                 verifyToken, checkRole('admin','officer'), ctrl.addCharge);
router.put('/:id/status',        verifyToken, checkRole('admin'),           ctrl.updateChargeStatus);

module.exports = router;
