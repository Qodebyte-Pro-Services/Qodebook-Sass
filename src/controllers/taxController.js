const pool = require('../config/db');

exports.createTax = async (req, res) => {
  try {
    const { business_id, name, rate, type, description } = req.body;
    if (!business_id || !name || !rate || !type) return res.status(400).json({ message: 'Missing required fields.' });
    const result = await pool.query('INSERT INTO taxes (business_id, name, rate, type, description) VALUES ($1, $2, $3, $4, $5) RETURNING *', [business_id, name, rate, type, description]);
    return res.status(201).json({ tax: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
exports.listTaxes = async (req, res) => {
  try {
    const { business_id } = req.query;
    let query = 'SELECT * FROM taxes';
    let params = [];

    if (business_id) {
      query += ' WHERE business_id = $1';
      params.push(business_id);
    }

    const result = await pool.query(query, params);
    return res.status(200).json({ taxes: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
exports.linkTaxToProduct = async (req, res) => {
  try {
    const { product_id, tax_id } = req.body;
    if (!product_id || !tax_id) return res.status(400).json({ message: 'Missing required fields.' });
    const result = await pool.query('INSERT INTO product_taxes (product_id, tax_id) VALUES ($1, $2) RETURNING *', [product_id, tax_id]);
    return res.status(201).json({ product_tax: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.unlinkTaxFromProducts = async (req, res) => {
  try {
    const { tax_id } = req.params;
    if (!tax_id) return res.status(400).json({ message: 'Missing required field: tax_id.' });

    const check = await pool.query(
      'SELECT * FROM product_taxes WHERE tax_id = $1',
      [tax_id]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'No products are linked to this tax.' });
    }
    await pool.query('DELETE FROM product_taxes WHERE tax_id = $1', [tax_id]);
    return res.status(200).json({ message: 'Tax unlinked from products successfully.', unlinked_count: check.rows.length });
  } catch (error) {
    console.error('Error unlinking tax from products:');
    return res.status(500).json({ message: 'Server error.',  });
  }
} 



exports.unlinkTaxFromProduct = async (req, res) => {
  try {
    const { product_id, tax_id } = req.params;
    if (!product_id || !tax_id) return res.status(400).json({ message: 'Missing required fields.' });

    const check = await pool.query(
      'SELECT * FROM product_taxes WHERE product_id = $1 AND tax_id = $2',
      [product_id, tax_id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'This product is not linked to the specified tax.' });
    }

    await pool.query(
      'DELETE FROM product_taxes WHERE product_id = $1 AND tax_id = $2',
      [product_id, tax_id]
    );

    return res.status(200).json({
      message: `Successfully unlinked product ${product_id} from tax ${tax_id}.`,
    });
  } catch (error) {
    console.error('Error unlinking product from tax:');
    return res.status(500).json({ message: 'Server error.',  });
  }
}

exports.getListOfProductsAndTheirTaxes = async (req, res) =>  {
  try {
    const { business_id } = req.query;
    if (!business_id) return res.status(400).json({ message: 'Missing business_id parameter.' });
    const result = await pool.query(
      `SELECT p.id AS product_id, p.name AS product_name, t.id AS tax_id, t.name AS tax_name, t.rate, t.type
        FROM products p
        LEFT JOIN product_taxes pt ON p.id = pt.product_id
        LEFT JOIN taxes t ON pt.tax_id = t.id
        WHERE p.business_id = $1`,
      [business_id]
    );
    return res.status(200).json({ products_with_taxes: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
}

exports.getTaxesForProduct = async (req, res) => {
  try {
    const { product_id } = req.params;
    if (!product_id) return res.status(400).json({ message: 'Missing product_id parameter.' });
    const result = await pool.query(
      `SELECT t.* FROM taxes t
       JOIN product_taxes pt ON t.id = pt.tax_id
       WHERE pt.product_id = $1`,
      [product_id]
    );
    return res.status(200).json({ taxes: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
}


exports.getTaxesForVariantsBasedOnProduct = async (req, res) => {
  try {
    const { product_id } = req.params;
    if (!product_id) return res.status(400).json({ message: 'Missing product_id parameter.' });
    const result = await pool.query(
      `SELECT t.* FROM taxes t
        JOIN product_taxes pt ON t.id = pt.tax_id
        WHERE pt.product_id = $1`,
      [product_id]
    );
    return res.status(200).json({ taxes: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
}

exports.deleteTax = async (req, res) => {
  try {
    const { tax_id } = req.params;
    if (!tax_id) return res.status(400).json({ message: 'Missing tax_id parameter.' });

    // Check if tax exists
    const taxRes = await pool.query('SELECT * FROM taxes WHERE id = $1', [tax_id]);
    if (taxRes.rows.length === 0) {
      return res.status(404).json({ message: 'Tax not found.' });
    }

    // Remove tax from product_taxes first (to avoid FK constraint errors)
    await pool.query('DELETE FROM product_taxes WHERE tax_id = $1', [tax_id]);
    // Then delete the tax itself
    await pool.query('DELETE FROM taxes WHERE id = $1', [tax_id]);

    return res.status(200).json({ message: 'Tax deleted.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
}

exports.updateTax = async (req, res) => {
  try {
    const { tax_id } = req.params;
    const { name, rate, type, description } = req.body;
    if (!tax_id) return res.status(400).json({ message: 'Missing tax_id parameter.' });
    const fields = [];
    const values = [];
    let idx = 1;  
    if (name) { fields.push(`name = $${idx++}`); values.push(name); }
    if (rate) { fields.push(`rate = $${idx++}`); values.push(rate); }
    if (type) { fields.push(`type = $${idx++}`); values.push(type); }
    if (description) { fields.push(`description = $${idx++}`); values.push(description); }
    if (fields.length === 0) return res.status(400).json({ message: 'No fields to update.' });
    values.push(tax_id);
    const query = `UPDATE taxes SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    const result = await pool.query(query, values);
    return res.status(200).json({ tax: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
}