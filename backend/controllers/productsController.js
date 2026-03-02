const pool = require('../config/database');

const getProducts = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { price_per_litre } = req.body;

    if (price_per_litre === undefined) {
      return res.status(400).json({ error: 'price_per_litre is required' });
    }

    const result = await pool.query(
      'UPDATE products SET price_per_litre = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [price_per_litre, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, price_per_litre } = req.body;

    if (!name || price_per_litre === undefined) {
      return res.status(400).json({ error: 'name and price_per_litre are required' });
    }

    const result = await pool.query(
      'INSERT INTO products (name, price_per_litre) VALUES ($1, $2) RETURNING *',
      [name, price_per_litre]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getProducts, updateProduct, createProduct };
