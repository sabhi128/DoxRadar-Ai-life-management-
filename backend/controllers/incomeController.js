const asyncHandler = require('express-async-handler');
const prisma = require('../prismaClient');

// @desc    Get all income sources
// @route   GET /api/income
// @access  Private
const getIncomes = asyncHandler(async (req, res) => {
    const incomes = await prisma.income.findMany({
        where: { userId: req.user.id },
        orderBy: { date: 'desc' },
    });
    res.status(200).json(incomes);
});

// @desc    Create new income source
// @route   POST /api/income
// @access  Private
const createIncome = asyncHandler(async (req, res) => {
    const { name, amount, frequency, category, date, notes } = req.body;

    if (!name || !amount) {
        res.status(400);
        throw new Error('Please add name and amount');
    }

    const income = await prisma.income.create({
        data: {
            userId: req.user.id,
            name,
            amount: parseFloat(amount),
            frequency: frequency || 'Monthly',
            category: category || 'Salary',
            date: date ? new Date(date) : new Date(),
            notes,
        },
    });

    res.status(201).json(income);
});

// @desc    Delete income source
// @route   DELETE /api/income/:id
// @access  Private
const deleteIncome = asyncHandler(async (req, res) => {
    const income = await prisma.income.findUnique({
        where: { id: req.params.id }
    });

    if (!income) {
        res.status(404);
        throw new Error('Income not found');
    }

    if (income.userId !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    await prisma.income.delete({
        where: { id: req.params.id }
    });

    res.status(200).json({ id: req.params.id });
});

module.exports = {
    getIncomes,
    createIncome,
    deleteIncome,
};
