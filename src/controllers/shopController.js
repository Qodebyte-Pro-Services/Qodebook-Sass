const db = require('../config/db');

exports.listProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const business_id = req.user.business_id;
    const offset = (page - 1) * limit;

    let query = `SELECT * FROM products WHERE is_active = true AND business_id = $1`;
    const params = [business_id];

    if (search) {
      query += ' AND (name ILIKE $2 OR description ILIKE $2)';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT $3 OFFSET $4';
    params.push(limit, offset);

    const { rows } = await db.query(query, params);
    res.json({ products: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products',  });
  }
};


exports.getProduct = async (req, res) => {
  try {
    const { id } = req.params;
      const business_id = req.user.business_id;
     const productQuery = 'SELECT * FROM products WHERE id = $1 AND business_id = $2 AND is_active = true';
    const productResult = await db.query(productQuery, [id, business_id]);
    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const product = productResult.rows[0];
  const variantsQuery = `
    SELECT v.* FROM variants v
    JOIN products p ON v.product_id = p.id
    WHERE v.product_id = $1 AND p.business_id = $2 AND v.is_active = true
  `;
    const variantsResult = await db.query(variantsQuery, [id, business_id]);
    product.variants = variantsResult.rows;
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product',  });
  }
};


exports.getVariant = async (req, res) => {
  try {
    const { id } = req.params;
      const business_id = req.user.business_id;
   const variantQuery = `
    SELECT v.* FROM variants v
    JOIN products p ON v.product_id = p.id
    WHERE v.id = $1 AND p.business_id = $2 AND v.is_active = true
  `;
    const variantResult = await db.query(variantQuery, [id, business_id]);
    if (variantResult.rows.length === 0) {
      return res.status(404).json({ error: 'Variant not found' });
    }
    res.json(variantResult.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch variant',  });
  }
};
