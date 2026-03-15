const pool = require('./config/database');

async function createTable() {
    try {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS stock (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) UNIQUE,
        available_stock NUMERIC(10, 2) DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // Insert initial stock for existing products if not present
        const products = await pool.query('SELECT * FROM products');
        for (const prod of products.rows) {
            await pool.query(`
        INSERT INTO stock (product_id, available_stock)
        VALUES ($1, 0)
        ON CONFLICT (product_id) DO NOTHING;
      `, [prod.id]);
        }

        console.log('Stock table created and initialized.');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        pool.end();
    }
}

createTable();
