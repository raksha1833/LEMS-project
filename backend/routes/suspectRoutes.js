// routes/suspectRoutes.js
const express     = require('express');
const router      = express.Router();
const ctrl        = require('../controllers/suspectController');
const verifyToken = require('../middleware/auth');
const checkRole   = require('../middleware/roleCheck');

router.get('/',           verifyToken,                             ctrl.getAllSuspects);
router.get('/:id',        verifyToken,                             ctrl.getSuspectById);
router.post('/',          verifyToken, checkRole('admin','officer'), ctrl.createSuspect);
router.post('/arrest',    verifyToken, checkRole('admin','officer'), ctrl.arrestSuspect);
router.post('/:id/link',  verifyToken, checkRole('admin','officer'), ctrl.linkToCase);

module.exports = router;
