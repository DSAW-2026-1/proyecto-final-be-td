const express = require('express');
const router = express.Router();
const { getDashboard, getAllUsers, suspendUser, getReports, resolveReport } = require('../controllers/misc.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

router.use(authenticate, requireRole('ADMIN'));

router.get('/dashboard', getDashboard);
router.get('/users', getAllUsers);
router.patch('/users/:id/suspend', suspendUser);
router.get('/reports', getReports);
router.patch('/reports/:id', resolveReport);

module.exports = router;
