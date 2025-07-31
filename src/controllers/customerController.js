const pool = require('../config/db');


exports.addCustomer = async (req, res) => {
  try {
    const { business_id, name, phone, email } = req.body;
    if (!business_id || !name) return res.status(400).json({ message: 'business_id and name are required.' });
    const result = await pool.query('INSERT INTO customers (business_id, name, phone, email) VALUES ($1, $2, $3, $4) RETURNING *', [business_id, name, phone, email]);
    return res.status(201).json({ customer: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.listCustomers = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers');
    return res.status(200).json({ customers: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.getCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Customer not found.' });
    return res.status(200).json({ customer: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email } = req.body;
    let setParts = [];
    let values = [];
    let idx = 1;
    if (name) { setParts.push('name = $' + idx); values.push(name); idx++; }
    if (phone) { setParts.push('phone = $' + idx); values.push(phone); idx++; }
    if (email) { setParts.push('email = $' + idx); values.push(email); idx++; }
    if (setParts.length === 0) return res.status(400).json({ message: 'No fields to update.' });
    values.push(id);
    const setClause = setParts.join(', ');
    const query = 'UPDATE customers SET ' + setClause + ' WHERE id = $' + idx + ' RETURNING *';
    const result = await pool.query(query, values);
    return res.status(200).json({ customer: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM customers WHERE id = $1', [id]);
    return res.status(200).json({ message: 'Customer deleted.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.getCustomerOrders = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM orders WHERE customer_id = $1', [id]);
    return res.status(200).json({ orders: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
