const pool = require('../config/db');


exports.restockVariant = async (req, res) => {
  try {
    const { variant_id, quantity, cost_price, expiry_date, note, supplier_id } = req.body;
    if (!variant_id || !quantity || !cost_price) return res.status(400).json({ message: 'variant_id, quantity, and cost_price are required.' });
    const variantRes = await pool.query('UPDATE variants SET quantity = quantity + $1, cost_price = $2, expiry_date = COALESCE($3, expiry_date) WHERE id = $4 RETURNING *', [quantity, cost_price, expiry_date, variant_id]);
    if (variantRes.rows.length === 0) return res.status(404).json({ message: 'Variant not found.' });
    await pool.query('INSERT INTO inventory_logs (variant_id, type, quantity, note) VALUES ($1, $2, $3, $4)', [variant_id, 'restock', quantity, note || null]);
    if (supplier_id) {
      await pool.query('INSERT INTO supply_entries (supplier_id, variant_id, quantity, cost_price) VALUES ($1, $2, $3, $4)', [supplier_id, variant_id, quantity, cost_price]);
    }
    return res.status(200).json({ message: 'Variant restocked.', variant: variantRes.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.getStockMovements = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inventory_logs ORDER BY created_at DESC');
    return res.status(200).json({ logs: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.getStockMovementsByVariant = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM inventory_logs WHERE variant_id = $1 ORDER BY created_at DESC', [id]);
    return res.status(200).json({ logs: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.deleteStockMovement = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM inventory_logs WHERE id = $1', [id]);
    return res.status(200).json({ message: 'Stock movement deleted.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.getLowStock = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM variants WHERE quantity <= threshold AND quantity > 0');
    return res.status(200).json({ variants: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.getOutOfStock = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM variants WHERE quantity = 0');
    return res.status(200).json({ variants: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.getExpiredStock = async (req, res) => {
  try {
    const now = new Date();
    const result = await pool.query('SELECT * FROM variants WHERE expiry_date IS NOT NULL AND expiry_date < $1', [now]);
    return res.status(200).json({ variants: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.getRecentlyRestocked = async (req, res) => {
  try {
    const result = await pool.query("SELECT v.*, l.created_at AS restocked_at FROM variants v JOIN inventory_logs l ON v.id = l.variant_id WHERE l.type = 'restock' ORDER BY l.created_at DESC LIMIT 20");
    return res.status(200).json({ variants: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.getFastMoving = async (req, res) => {
  try {
    const result = await pool.query("SELECT variant_id, SUM(quantity) as total_sold FROM inventory_logs WHERE type = 'sale' AND created_at > NOW() - INTERVAL '30 days' GROUP BY variant_id ORDER BY total_sold DESC LIMIT 20");
    return res.status(200).json({ fast_moving: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.getSlowMoving = async (req, res) => {
  try {
    const result = await pool.query("SELECT variant_id, SUM(quantity) as total_sold FROM inventory_logs WHERE type = 'sale' AND created_at > NOW() - INTERVAL '30 days' GROUP BY variant_id ORDER BY total_sold ASC LIMIT 20");
    return res.status(200).json({ slow_moving: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
