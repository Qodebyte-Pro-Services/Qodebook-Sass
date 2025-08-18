const pool = require('../config/db');

exports.addSupplier = async (req, res) => {
  try {
    const { business_id, name, contact } = req.body;
    if (!business_id || !name) return res.status(400).json({ message: 'business_id and name are required.' });
    const result = await pool.query('INSERT INTO suppliers (business_id, name, contact) VALUES ($1, $2, $3) RETURNING *', [business_id, name, contact]);
    return res.status(201).json({ supplier: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.listSuppliers = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM suppliers');
    return res.status(200).json({ suppliers: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.getSuppliersByBusiness = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM suppliers WHERE business_id = $1', [id]);
    return res.status(200).json({ suppliers: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact } = req.body;
    let setParts = [];
    let values = [];
    let idx = 1;
    if (name) { setParts.push('name = $' + idx); values.push(name); idx++; }
    if (contact) { setParts.push('contact = $' + idx); values.push(contact); idx++; }
    if (setParts.length === 0) return res.status(400).json({ message: 'No fields to update.' });
    values.push(id);
    const setClause = setParts.join(', ');
    const query = 'UPDATE suppliers SET ' + setClause + ' WHERE id = $' + idx + ' RETURNING *';
    const result = await pool.query(query, values);
    return res.status(200).json({ supplier: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM suppliers WHERE id = $1', [id]);
    return res.status(200).json({ message: 'Supplier deleted.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.getSupplierStockMovements = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT sos.id AS supply_order_id,
             sos.supply_status,
             sos.expected_delivery_date,
             sos.supply_order_date,
             sos.business_id,
             s.name AS supplier_name,
             soi.variant_id,
             v.sku AS variant_sku,
             soi.quantity,
             soi.cost_price
      FROM supply_orders sos
      JOIN suppliers s ON sos.supplier_id = s.id
      JOIN supply_order_items soi ON sos.id = soi.supply_order_id
      JOIN variants v ON soi.variant_id = v.id
      ORDER BY sos.expected_delivery_date DESC
    `);

    return res.status(200).json({ supply_orders: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

