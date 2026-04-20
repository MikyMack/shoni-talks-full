const express = require('express');
const router = express.Router();
const planController = require('../controllers/planController');

router.post('/', planController.createPlan);
router.get('/', planController.getPlans);
router.get('/:id', planController.getPlanById);
router.put('/:id', planController.updatePlan);
router.delete('/:id', planController.deletePlan);
router.patch('/:id/toggle', planController.togglePlan);

module.exports = router;
