const { Router } = require('express');
const adminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth');

const router = Router();

router.use(authenticate);
router.get('/settings', authorize('SUPERUSER'), adminController.getSettings);
router.put('/settings', authorize('SUPERUSER'), adminController.updateSettings);
router.post('/mentor/ai-query', authorize('MENTOR', 'SUPERUSER'), adminController.aiQuery);

module.exports = router;
