// src/controllers/analyticsUnifiedController.js
const db = require('../config/db');

// Unified sales analytics (POS + e-commerce)
exports.salesOverview = async (req, res) => {
  try {
    const { business_id } = req;
    const { start_date, end_date } = req.query;
    let query = `SELECT source, SUM(total_price) as total_sales, COUNT(*) as order_count
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.business_id = $1`;
    let params = [business_id];
    if (start_date) { query += ' AND o.created_at >= $2'; params.push(start_date); }
    if (end_date) { query += ' AND o.created_at <= $3'; params.push(end_date); }
    query += ' GROUP BY source';
    const { rows } = await db.query(query, params);
    res.json({ sales: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sales analytics',  });
  }
};

// Unified inventory analytics
exports.inventoryOverview = async (req, res) => {
  try {
    const { business_id } = req;
    const query = `SELECT p.id as product_id, p.name, SUM(v.stock) as total_stock
      FROM products p
      JOIN variants v ON p.id = v.product_id
      WHERE p.business_id = $1
      GROUP BY p.id, p.name`;
    const { rows } = await db.query(query, [business_id]);
    res.json({ inventory: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch inventory analytics',  });
  }
};

// Unified customer analytics
exports.customerOverview = async (req, res) => {
  try {
    const { business_id } = req;
    const query = `SELECT COUNT(*) as customer_count FROM customers WHERE business_id = $1`;
    const { rows } = await db.query(query, [business_id]);
    res.json({ customers: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customer analytics',  });
  }
};
