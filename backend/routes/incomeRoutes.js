const express = require('express');
const router = express.Router();
const { getIncomes, createIncome, deleteIncome } = require('../controllers/incomeController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getIncomes)
    .post(createIncome);

router.route('/:id')
    .delete(deleteIncome);

module.exports = router;
