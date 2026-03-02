const pool = require('../config/database');
const { sendNotification } = require('../config/firebase');

const createSale = async (req, res) => {
  try {
    const { product_id, weight, deviceToken } = req.body;

    if (!product_id || !weight) {
      return res.status(400).json({ error: 'product_id and weight are required' });
    }

    // Get product details
    const productResult = await pool.query(
      'SELECT * FROM products WHERE id = $1',
      [product_id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = productResult.rows[0];
    const total_amount = (weight * product.price_per_litre).toFixed(2);

    // Insert sale
    const saleResult = await pool.query(
      'INSERT INTO sales (product_id, weight, total_amount) VALUES ($1, $2, $3) RETURNING *',
      [product_id, weight, total_amount]
    );

    // Store notification
    await pool.query(
      'INSERT INTO notifications (user_id, product_name, weight, total_amount) VALUES ($1, $2, $3, $4)',
      [req.user.id, product.name, weight, total_amount]
    );

    // Send push notification if deviceToken provided
    if (deviceToken) {
      await sendNotification(
        deviceToken,
        'Sale Recorded',
        `${product.name} - ${weight}kg: ${total_amount}`,
        {
          product_id: product_id.toString(),
          weight: weight.toString(),
          total_amount: total_amount.toString(),
        }
      );
    }

    res.status(201).json(saleResult.rows[0]);
  } catch (error) {
    console.error('Create sale error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getSales = async (req, res) => {
  try {
    const { filter } = req.query;

    let query = `
      SELECT s.*, p.name as product_name, p.price_per_litre
      FROM sales s
      JOIN products p ON s.product_id = p.id
    `;

    if (filter === 'today') {
      query += ` WHERE DATE(s.created_at) = CURRENT_DATE`;
    }

    query += ` ORDER BY s.created_at DESC`;

    const result = await pool.query(query);
    const sales = result.rows;

    // Calculate totals
    const totalEarnings = sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0);
    const totalTransactions = sales.length;

    // Group by category (product name)
    const earningsByCategory = {};
    sales.forEach((sale) => {
      if (!earningsByCategory[sale.product_name]) {
        earningsByCategory[sale.product_name] = 0;
      }
      earningsByCategory[sale.product_name] += parseFloat(sale.total_amount);
    });

    res.json({
      sales,
      totalEarnings: totalEarnings.toFixed(2),
      earningsByCategory,
      totalTransactions,
    });
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { createSale, getSales };
