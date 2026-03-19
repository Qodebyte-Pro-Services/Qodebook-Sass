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
    const { business_id, filter = 'all', limit = 50, offset = 0, sort_by = 'created_at' } = req.query;

    if (!business_id) {
      return res.status(400).json({ message: 'business_id is required.' });
    }

    const validFilters = ['all', 'top', 'returning', 'walk_in'];
    if (!validFilters.includes(filter)) {
      return res.status(400).json({ message: `Invalid filter. Must be one of: ${validFilters.join(', ')}` });
    }

    const validSortFields = ['created_at', 'name', 'total_purchases', 'order_count'];
    if (!validSortFields.includes(sort_by)) {
      return res.status(400).json({ message: `Invalid sort_by. Must be one of: ${validSortFields.join(', ')}` });
    }

  
    let query = `
      WITH customers_data AS (
        -- Named customers with order aggregations
        SELECT 
          c.id,
          c.business_id,
          c.name,
          c.phone,
          c.email,
          c.created_at,
          COUNT(DISTINCT o.id)::INT AS order_count,
          COALESCE(SUM(o.total_amount), 0)::NUMERIC AS total_purchases,
          MAX(o.created_at) AS last_purchase_date,
          false AS is_walk_in
        FROM customers c
        LEFT JOIN orders o ON c.id = o.customer_id AND o.business_id = c.business_id
        WHERE c.business_id = $1
        GROUP BY c.id, c.business_id, c.name, c.phone, c.email, c.created_at

        UNION ALL

        -- Walk-in customers (orders with NULL customer_id)
        SELECT 
          NULL::INT AS id,
          $1::INT AS business_id,
          'Walk-in Customers' AS name,
          NULL AS phone,
          NULL AS email,
          MIN(o.created_at)::TIMESTAMP AS created_at,
          COUNT(DISTINCT o.id)::INT AS order_count,
          COALESCE(SUM(o.total_amount), 0)::NUMERIC AS total_purchases,
          MAX(o.created_at) AS last_purchase_date,
          true AS is_walk_in
        FROM orders o
        WHERE o.business_id = $1 AND o.customer_id IS NULL
        GROUP BY o.business_id
      )
      SELECT * FROM customers_data
    `;

    const params = [business_id];


    switch (filter) {
      case 'top':
        query += ` WHERE total_purchases > 0`;
        break;
      case 'returning':
        query += ` WHERE order_count > 1`;
        break;
      case 'walk_in':
        query += ` WHERE is_walk_in = true`;
        break;
      case 'all':
      default:
       
        break;
    }

  
    let orderClause = '';
    switch (sort_by) {
      case 'total_purchases':
        orderClause = ' ORDER BY total_purchases DESC';
        break;
      case 'order_count':
        orderClause = ' ORDER BY order_count DESC';
        break;
      case 'name':
        orderClause = ' ORDER BY name ASC';
        break;
      case 'created_at':
      default:
        orderClause = ' ORDER BY created_at DESC';
        break;
    }

    query += orderClause;

   
    query += ` LIMIT $2 OFFSET $3`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

   
    let countQuery = `
      WITH customers_data AS (
        SELECT 
          c.id, c.business_id, false AS is_walk_in
        FROM customers c
        WHERE c.business_id = $1

        UNION ALL

        SELECT 
          NULL::INT AS id, $1::INT AS business_id, true AS is_walk_in
        FROM orders o
        WHERE o.business_id = $1 AND o.customer_id IS NULL
      )
      SELECT COUNT(*) AS total FROM customers_data
    `;

    switch (filter) {
      case 'top':
        countQuery = countQuery.replace('FROM customers_data', 
          `FROM customers_data cd
           LEFT JOIN orders o ON cd.id = o.customer_id AND o.business_id = cd.business_id
           WHERE cd.business_id = $1 AND COALESCE(SUM(o.total_amount), 0) > 0`);
        break;
      case 'returning':
        countQuery = `
          WITH cust_data AS (
            SELECT c.id, c.business_id, COUNT(DISTINCT o.id) AS order_count
            FROM customers c
            LEFT JOIN orders o ON c.id = o.customer_id AND o.business_id = c.business_id
            WHERE c.business_id = $1
            GROUP BY c.id, c.business_id
            HAVING COUNT(DISTINCT o.id) > 1
          )
          SELECT COUNT(*) AS total FROM cust_data
        `;
        break;
      case 'walk_in':
        countQuery = `
          SELECT COUNT(*) AS total FROM orders
          WHERE business_id = $1 AND customer_id IS NULL
        `;
        break;
      case 'all':
      default:
        countQuery = `
          WITH customers_data AS (
            SELECT c.id FROM customers WHERE business_id = $1
            UNION
            SELECT NULL::INT FROM orders WHERE business_id = $1 AND customer_id IS NULL LIMIT 1
          )
          SELECT COUNT(*) AS total FROM customers_data
        `;
        break;
    }

    const countResult = await pool.query(countQuery, [business_id]);
    const total = parseInt(countResult.rows[0].total, 10);

    return res.status(200).json({
      success: true,
      filter,
      pagination: {
        current_page: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
        total_pages: Math.ceil(total / parseInt(limit)),
        total_records: total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      },
      customers: result.rows
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
