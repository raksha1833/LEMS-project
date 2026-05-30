// routes/evidenceRoutes.js
const express     = require('express');
const router      = express.Router();
const ctrl        = require('../controllers/evidenceController');
const verifyToken = require('../middleware/auth');
const checkRole   = require('../middleware/roleCheck');

router.get('/',              verifyToken,                             ctrl.getAllEvidence);
router.get('/:id',           verifyToken,                             ctrl.getEvidenceById);
router.post('/',             verifyToken, checkRole('admin','officer'), ctrl.addEvidence);
router.put('/:id/status',    verifyToken, checkRole('admin','officer'), ctrl.updateStatus);
router.delete('/:id',        verifyToken, checkRole('admin'),           ctrl.deleteEvidence);

module.exports = router;
