// routes/caseRoutes.js
const express     = require('express');
const router      = express.Router();
const ctrl        = require('../controllers/caseController');
const verifyToken = require('../middleware/auth');
const checkRole   = require('../middleware/roleCheck');

router.get('/',                 verifyToken,                             ctrl.getAllCases);
router.get('/timeline',         verifyToken,                             ctrl.getCaseTimeline);
router.get('/:id',              verifyToken,                             ctrl.getCaseById);
router.put('/:id/priority',     verifyToken, checkRole('admin','officer'), ctrl.updatePriority);
router.put('/:id/close',        verifyToken, checkRole('admin','officer'), ctrl.closeCase);
router.post('/:id/officers',    verifyToken, checkRole('admin'),           ctrl.assignOfficer);
router.post('/:id/victims',     verifyToken, checkRole('admin','officer'), ctrl.addVictim);
router.post('/:id/witnesses',   verifyToken, checkRole('admin','officer'), ctrl.addWitness);
router.post('/:id/log',         verifyToken, checkRole('admin','officer'), ctrl.addLog);

module.exports = router;
