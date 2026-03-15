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

      // Check stock before sale for mismatch logging
      const stockRes = await client.query('SELECT available_stock FROM stock WHERE product_id = $1', [product_id]);
      let isMismatch = false;
      if (stockRes.rows.length > 0) {
        if (parseFloat(stockRes.rows[0].available_stock) < numericWeight) {
          isMismatch = true;
        }
      }

      // Insert into sales table (The source of truth)
      const saleResult = await client.query(
        'INSERT INTO sales (product_id, weight, total_amount, user_id, is_mismatch) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [product_id, numericWeight, total_amount, userId, isMismatch]
      );

      // Reduce stock
      await client.query(
        `INSERT INTO stock (product_id, available_stock, last_updated)
         VALUES ($2, -($1::numeric), CURRENT_TIMESTAMP)
         ON CONFLICT (product_id) 
         DO UPDATE SET available_stock = stock.available_stock - ($1::numeric), last_updated = CURRENT_TIMESTAMP`,
        [numericWeight, product_id]
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
    const { startDate, endDate, categories, filter } = req.query;

    let query = `
      SELECT s.*, p.name as product_name, p.price_per_litre
      FROM sales s
      JOIN products p ON s.product_id = p.id
      WHERE 1=1
    `;

    const queryParams = [];

    // Filter by date range or specific date using IST (Asia/Kolkata)
    if (startDate || endDate || filter === 'today') {
      let startStr = startDate;
      let endStr = endDate || startDate;

      if (filter === 'today') {
        query += ` AND (s.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date`;
      } else if (startStr && endStr) {
        queryParams.push(startStr, endStr);
        // Using $1 and $2 explicitly correctly handles the range
        query += ` AND (s.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date BETWEEN $${queryParams.length - 1} AND $${queryParams.length}`;
      } else if (startStr) {
        queryParams.push(startStr);
        query += ` AND (s.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date = $${queryParams.length}`;
      }
    }

    // Filter by categories
    if (categories) {
      const categoryList = Array.isArray(categories) ? categories : categories.split(',');
      if (categoryList.length > 0) {
        queryParams.push(categoryList);
        query += ` AND p.name = ANY($${queryParams.length})`;
      }
    }

    query += ` ORDER BY s.created_at DESC`;

    const result = await pool.query(query, queryParams);
    const sales = result.rows;

    const totalEarnings = sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0);
    const totalTransactions = sales.length;

    const earningsByCategory = {};
    sales.forEach(sale => {
      const cat = sale.product_name;
      const amt = parseFloat(sale.total_amount);
      earningsByCategory[cat] = (earningsByCategory[cat] || 0) + amt;
    });

    res.json({
      sales,
      totalEarnings: totalEarnings.toFixed(2),
      totalTransactions,
      earningsByCategory
    });
  } catch (error) {
    console.error('Fetch sales error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getNotifications = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.id, p.name as product_name, s.weight, s.total_amount, s.created_at, s.is_mismatch 
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
