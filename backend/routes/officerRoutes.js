// routes/officerRoutes.js
const express     = require('express');
const router      = express.Router();
const ctrl        = require('../controllers/officerController');
const verifyToken = require('../middleware/auth');
const checkRole   = require('../middleware/roleCheck');

router.get('/ranks',       verifyToken,                       ctrl.getRanks);
router.get('/workload',    verifyToken,                       ctrl.getWorkload);
router.get('/',            verifyToken,                       ctrl.getAllOfficers);
router.get('/:id',         verifyToken,                       ctrl.getOfficerById);
router.post('/',           verifyToken, checkRole('admin'),   ctrl.createOfficer);
router.put('/:id/status',  verifyToken, checkRole('admin'),   ctrl.updateStatus);

module.exports = router;
