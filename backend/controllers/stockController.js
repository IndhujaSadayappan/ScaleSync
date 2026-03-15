const pool = require('../config/database');

const getStock = async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT p.id as product_id, p.name as product_name, COALESCE(s.available_stock, 0) as available_stock, s.last_updated
      FROM products p
      LEFT JOIN stock s ON p.id = s.product_id
      ORDER BY p.id
    `);
        res.json(result.rows);
    } catch (error) {
        console.error('Get stock error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const updateStock = async (req, res) => {
    try {
        const { product_id, stock } = req.body;

        if (!product_id || stock === undefined) {
            return res.status(400).json({ error: 'product_id and stock are required' });
        }

        const numericStock = parseFloat(stock);

        const result = await pool.query(
            `INSERT INTO stock (product_id, available_stock, last_updated)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (product_id) 
       DO UPDATE SET available_stock = stock.available_stock + EXCLUDED.available_stock, last_updated = CURRENT_TIMESTAMP
       RETURNING *`,
            [product_id, numericStock]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Update stock error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const clearAndUpdateStock = async (req, res) => {
    try {
        const { product_id, stock } = req.body; // The user enters total available stock (not adding, just setting it directly).
        // The prompt says: "The owner enters the total available oil stock... Groundnut Oil 100 kg. This is stored in the database."
        // Also "Example: Groundnut Oil : 100 kg ... Buttons: Update Stock, Save"
        if (!product_id || stock === undefined) {
            return res.status(400).json({ error: 'product_id and stock are required' });
        }

        const numericStock = parseFloat(stock);

        const result = await pool.query(
            `INSERT INTO stock (product_id, available_stock, last_updated)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (product_id) 
       DO UPDATE SET available_stock = EXCLUDED.available_stock, last_updated = CURRENT_TIMESTAMP
       RETURNING *`,
            [product_id, numericStock]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Update stock error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { getStock, updateStock, setStock: clearAndUpdateStock };
