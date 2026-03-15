const express = require('express');
const router = express.Router();

const { login, register } = require('../controllers/authController');
const { getProducts, updateProduct, createProduct, deleteProduct } = require('../controllers/productsController');
const { createSale, getSales, getNotifications } = require('../controllers/salesController');
const { getStock, setStock } = require('../controllers/stockController');
const { authenticateToken } = require('../middleware/auth');

// Auth routes (public)
router.post('/login', login);
router.post('/register', register);

// Products routes (protected)
router.get('/products', authenticateToken, getProducts);
router.put('/products/:id', authenticateToken, updateProduct);
router.post('/products', authenticateToken, createProduct);
router.delete('/products/:id', authenticateToken, deleteProduct);

// Sales routes (protected)
router.post('/sales', authenticateToken, createSale);
router.get('/sales', authenticateToken, getSales);
router.get('/notifications', authenticateToken, getNotifications);

// Stock routes (protected)
router.get('/stock', authenticateToken, getStock);
router.post('/stock/update', authenticateToken, setStock);

module.exports = router;
