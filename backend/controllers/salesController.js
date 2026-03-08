const pool = require('../config/database');
const { sendNotification } = require('../config/firebase');

const createSale = async (req, res) => {
  try {
    const { product_id, weight, deviceToken } = req.body;
    const userId = req.user ? req.user.id : null; // Handle cases where user might not be present

    if (!product_id || !weight) {
      return res.status(400).json({ error: 'product_id and weight are required' });
    }

    const productResult = await pool.query('SELECT * FROM products WHERE id = $1', [product_id]);
    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = productResult.rows[0];
    const numericWeight = parseFloat(weight);
    const total_amount = (numericWeight * product.price_per_litre).toFixed(2);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert into sales table (The source of truth)
      const saleResult = await client.query(
        'INSERT INTO sales (product_id, weight, total_amount, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [product_id, numericWeight, total_amount, userId]
      );

      await client.query('COMMIT');

      if (deviceToken) {
        try {
          await sendNotification(
            deviceToken,
            'Sale Recorded',
            `${product.name} - ${numericWeight}L: ₹${total_amount}`
          );
        } catch (pushError) {
          console.error('Push notification error:', pushError);
        }
      }

      res.status(201).json(saleResult.rows[0]);
    } catch (dbError) {
      await client.query('ROLLBACK');
      throw dbError;
    } finally {
      client.release();
    }
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
    } else if (filter && /^\d{4}-\d{2}-\d{2}$/.test(filter)) {
      query += ` WHERE DATE(s.created_at) = '${filter}'`;
    }

    query += ` ORDER BY s.created_at DESC`;

    const result = await pool.query(query);
    const sales = result.rows;

    const totalEarnings = sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0);
    const totalTransactions = sales.length;

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

const getNotifications = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.id, p.name as product_name, s.weight, s.total_amount, s.created_at 
       FROM sales s 
       JOIN products p ON s.product_id = p.id 
       ORDER BY s.created_at DESC`
    );

    res.json({ notifications: result.rows });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { createSale, getSales, getNotifications };
