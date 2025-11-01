const express = require('express');
const router = express.Router();
const weddingsController = require('../controllers/weddingsController');

// @route   GET /api/weddings/stats
// @desc    Lấy thống kê tổng quan weddings
// @access  Private (Admin)
router.get('/stats', weddingsController.getWeddingStats);

// @route   GET /api/weddings
// @desc    Lấy danh sách weddings với pagination và filter
// @access  Private (Admin)
// Query params: page, limit, status, month, search
router.get('/', weddingsController.getWeddingsList);

// @route   GET /api/weddings/:id
// @desc    Lấy chi tiết một wedding event
// @access  Private (Admin)
router.get('/:id', weddingsController.getWeddingDetail);

// @route   DELETE /api/weddings/:id
// @desc    Xóa wedding event
// @access  Private (Admin)
router.delete('/:id', weddingsController.deleteWedding);

module.exports = router;
