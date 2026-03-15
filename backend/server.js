const express = require('express');
const cors = require('cors');
require('dotenv').config();

const routes = require('./routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('ScaleSync API is online. Go to /health for status.');
});

app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    message: 'Server is running',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});


const pool = require('./config/database');

const PORT = process.env.PORT || 5000;

// Test DB connection and run DB migrations on startup
pool.query('SELECT NOW()')
  .then(async () => {
    console.log('Database connected successfully');
    try {
      // Auto migrate stock table for production deployment
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
      console.log('Stock table verified and initialized.');
    } catch (err) {
      console.error('Migration error:', err.message);
    }
  })
  .catch(err => console.error('Database connection error:', err.message));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


