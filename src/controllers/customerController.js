const pool = require('../config/db');


exports.addCustomer = async (req, res) => {
  try {
    const { business_id, name, phone, email } = req.body;
    if (!business_id || !name) return res.status(400).json({ message: 'business_id and name are required.' });
    const result = await pool.query(
      'INSERT INTO customers (business_id, name, phone, email, is_verified) VALUES ($1, $2, $3, $4, true) RETURNING *',
      [business_id, name, phone, email]
    );
    return res.status(201).json({ customer: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.listCustomers = async (req, res) => {
  const { business_id, filter = 'all', limit = 50, offset = 0, sort_by = 'created_at' } = req.query;

  if (!business_id) {
    return res.status(400).json({ message: 'business_id is required.' });
  }

  const VALID_FILTERS = new Set(['all', 'top', 'returning', 'walk_in']);
  const VALID_SORT_FIELDS = new Set(['created_at', 'name', 'total_purchases', 'order_count']);

  if (!VALID_FILTERS.has(filter)) {
    return res.status(400).json({ message: `Invalid filter.` });
  }
  if (!VALID_SORT_FIELDS.has(sort_by)) {
    return res.status(400).json({ message: `Invalid sort_by.` });
  }

  const FILTER_CLAUSE = {
    top:       'WHERE total_purchases > 0',
    returning: 'WHERE order_count > 1',
    walk_in:   'WHERE is_walk_in = true',
    all:       '',
  };

  const ORDER_CLAUSE = {
    total_purchases: 'ORDER BY total_purchases DESC',
    order_count:     'ORDER BY order_count DESC',
    name:            'ORDER BY name ASC',
    created_at:      'ORDER BY created_at DESC',
  };

  const parsedLimit  = Math.max(1, parseInt(limit));
  const parsedOffset = Math.max(0, parseInt(offset));

  const query = `
    WITH base AS (
      -- Named customers
      SELECT
        c.id,
        c.business_id,
        c.name,
        c.phone,
        c.email,
        c.created_at,
        c.is_verified,
        COUNT(o.id)::INT                 AS order_count,
        COALESCE(SUM(o.total_amount), 0) AS total_purchases,
        MAX(o.created_at)               AS last_purchase_date,
        false                           AS is_walk_in
      FROM customers c
      LEFT JOIN orders o
        ON o.customer_id = c.id
       AND o.business_id = c.business_id
      WHERE c.business_id = $1
      GROUP BY c.id, c.business_id, c.name, c.phone, c.email, c.created_at

      UNION ALL

      -- Walk-in customers (only if exists)
      SELECT
        0::INT,
        $1::INT,
        'Walk-in Customers',
        NULL,
        NULL,
        MIN(o.created_at),
        false,
        COUNT(o.id)::INT,
        COALESCE(SUM(o.total_amount), 0),
        MAX(o.created_at),
        true
      FROM orders o
      WHERE o.business_id = $1
        AND o.customer_id IS NULL
      HAVING COUNT(*) > 0
    ),
    filtered AS (
      SELECT * FROM base
      ${FILTER_CLAUSE[filter]}
    )
    SELECT *,
      COUNT(*) OVER () AS total_count
    FROM filtered
    ${ORDER_CLAUSE[sort_by]}
    LIMIT $2 OFFSET $3
  `;

  try {
    const { rows } = await pool.query(query, [business_id, parsedLimit, parsedOffset]);

    const total = rows.length ? parseInt(rows[0].total_count, 10) : 0;

    const customers = rows.map(({ total_count, ...rest }) => rest);

    return res.status(200).json({
      success: true,
      filter,
      pagination: {
        current_page: Math.floor(parsedOffset / parsedLimit) + 1,
        total_pages: Math.ceil(total / parsedLimit),
        total_records: total,
        limit: parsedLimit,
        offset: parsedOffset,
      },
      customers,
    });

  } catch (err) {
    console.error('Error listing customers:', err);
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
    return res.status(500).json({ message: 'Server error.'});
  }
};
