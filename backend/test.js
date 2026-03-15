const pool = require('./config/database');
pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'created_at'")
    .then(res => { console.log(res.rows); process.exit(0); })
    .catch(err => { console.error(err); process.exit(1); });
