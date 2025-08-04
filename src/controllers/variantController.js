
const pool = require('../config/db');
// const uploadToFirebase = require('../utils/uploadToFireBase');
const uploadToCloudinary = require('../utils/uploadToCloudinary');

exports.countVariantsInStock = async (req, res) => {
  try {
    const { business_id, branch_id } = req.query;
    let query = `SELECT COUNT(*) FROM variants v JOIN products p ON v.product_id = p.id WHERE v.quantity > 0`;
    let params = [];
    if (business_id) {
      query += ' AND p.business_id = $1';
      params.push(business_id);
      if (branch_id) {
        query += ' AND p.branch_id = $2';
        params.push(branch_id);
      }
    }
    const result = await pool.query(query, params);
    return res.status(200).json({ count: Number(result.rows[0].count) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.generateVariantNames = (req, res) => {
  const { product_name, attributes, separator } = req.body;
  if (!product_name) return res.status(400).json({ message: 'product_name is required.' });

 
  if (!attributes || !Array.isArray(attributes) || attributes.length === 0) {
    return res.json({ variant_names: [product_name] });
  }

 
  const sep = typeof separator === 'string' ? separator : ' - ';

  
  const combine = (arr) => arr.reduce(
    (acc, curr) => acc.flatMap(a => curr.values.map(v => [...a, v])),
    [[]]
  );

  const combos = combine(attributes);
  const variant_names = combos.map(combo => [product_name, ...combo].join(sep));
  return res.json({ variant_names });
};

exports.generateVariants = async (req, res) => {
  try {
    const { id: product_id } = req.params;
    const { variants } = req.body; 
    if (!variants || !Array.isArray(variants) || variants.length === 0) return res.status(400).json({ message: 'Variants array required.' });
    const inserted = [];
    
      let imageUrl = null;

    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file);
    }
    for (const v of variants) {
    
      const skuCheck = await pool.query('SELECT * FROM variants WHERE sku = $1', [v.sku]);
      if (skuCheck.rows.length > 0) return res.status(409).json({ message: `SKU ${v.sku} already exists.` });

      
      const attrComboCheck = await pool.query(
        'SELECT * FROM variants WHERE product_id = $1 AND attributes = $2',
        [product_id, JSON.stringify(v.attributes)]
      );
      if (attrComboCheck.rows.length > 0) return res.status(409).json({ message: 'Variant with this attribute combination already exists.' });

      
      const imageUrl = uploadedImageUrl || v.image_url || null;
      const barcode = v.barcode || null;
      const custom_price = v.custom_price || null;
      const result = await pool.query(
        'INSERT INTO variants (product_id, attributes, cost_price, selling_price, quantity, threshold, sku, image_url, expiry_date, barcode, custom_price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
        [product_id, JSON.stringify(v.attributes), v.cost_price, v.selling_price, v.quantity, v.threshold, v.sku, imageUrl, v.expiry_date, barcode, custom_price]
      );
      const variant = result.rows[0];
      inserted.push(variant);
      if (variant.quantity && variant.quantity > 0) {
        await pool.query('INSERT INTO inventory_logs (variant_id, type, quantity, note) VALUES ($1, $2, $3, $4)', [variant.id, 'restock', variant.quantity, 'Initial stock on variant creation']);
      }
    }
    return res.status(201).json({ message: 'Variants generated.', variants: inserted });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.listVariants = async (req, res) => {
  try {
    const { id: product_id } = req.params;
    const result = await pool.query('SELECT * FROM variants WHERE product_id = $1 AND deleted_at IS NULL', [product_id]);
    return res.status(200).json({ variants: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.getVariantsByBusiness = async (req, res) => {
  const user_id = req.user.user_id;
  const result = await pool.query(`
    SELECT v.* FROM variants v
    JOIN products p ON v.product_id = p.id
    JOIN businesses b ON p.business_id = b.id
    WHERE b.user_id = $1 AND v.deleted_at IS NULL
  `, [user_id]);
  return res.status(200).json({ variants: result.rows });
};

exports.getVariantByProduct = async (req, res) => {
  try {
    const { productId, variantId } = req.params;
    const result = await pool.query(
      'SELECT * FROM variants WHERE id = $1 AND product_id = $2 AND deleted_at IS NULL',
      [variantId, productId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Variant not found for this product.' });
    }
    return res.status(200).json({ variant: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.getVariantById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM variants WHERE id = $1 AND deleted_at IS NULL', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Variant not found' });
    }
    return res.status(200).json({ variant: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.createVariantsBatch = async (req, res) => {
  try {
    const { product_id, variants } = req.body;
    if (!product_id || !Array.isArray(variants) || variants.length === 0) {
      return res.status(400).json({ message: 'product_id and variants array are required.' });
    }
    const inserted = [];
    for (const v of variants) {
    
      if (!v.sku || !v.cost_price || !v.selling_price) {
        return res.status(400).json({ message: 'Each variant must have sku, cost_price, and selling_price.' });
      }
     
      const skuCheck = await pool.query('SELECT * FROM variants WHERE sku = $1 AND deleted_at IS NULL', [v.sku]);
      if (skuCheck.rows.length > 0) return res.status(409).json({ message: `SKU ${v.sku} already exists.` });
      const attrComboCheck = await pool.query(
        'SELECT * FROM variants WHERE product_id = $1 AND attributes = $2 AND deleted_at IS NULL',
        [product_id, JSON.stringify(v.attributes)]
      );
      if (attrComboCheck.rows.length > 0) return res.status(409).json({ message: 'Variant with this attribute combination already exists.' });
     
      const result = await pool.query(
        'INSERT INTO variants (product_id, attributes, cost_price, selling_price, quantity, threshold, sku, image_url, expiry_date, barcode, custom_price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
        [product_id, JSON.stringify(v.attributes), v.cost_price, v.selling_price, v.quantity || 0, v.threshold || 0, v.sku, v.image_url || null, v.expiry_date || null, v.barcode || null, v.custom_price || null]
      );
      inserted.push(result.rows[0]);
    }
    return res.status(201).json({ message: 'Batch variants created.', variants: inserted });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.updateVariant = async (req, res) => {
  try {
    const { id } = req.params;
    const { attributes, cost_price, selling_price, quantity, threshold, sku, image_url, expiry_date } = req.body;
    let setParts = [];
    let values = [];
    let idx = 1;
    if (attributes) { setParts.push('attributes = $' + idx); values.push(JSON.stringify(attributes)); idx++; }
    if (cost_price !== undefined) { setParts.push('cost_price = $' + idx); values.push(cost_price); idx++; }
    if (selling_price !== undefined) { setParts.push('selling_price = $' + idx); values.push(selling_price); idx++; }
    if (quantity !== undefined) { setParts.push('quantity = $' + idx); values.push(quantity); idx++; }
    if (threshold !== undefined) { setParts.push('threshold = $' + idx); values.push(threshold); idx++; }
    if (sku) { setParts.push('sku = $' + idx); values.push(sku); idx++; }
   
 
    let finalImageUrl = null;
    if (req.file) {
      finalImageUrl = await uploadToCloudinary(req.file);
    } else if (image_url) {
      finalImageUrl = image_url;
    }
    
    if (finalImageUrl) { setParts.push('image_url = $' + idx); values.push(finalImageUrl); idx++; }
    if (expiry_date) { setParts.push('expiry_date = $' + idx); values.push(expiry_date); idx++; }
    setParts.push('updated_at = NOW()');
    if (setParts.length === 1) return res.status(400).json({ message: 'No fields to update.' });
    values.push(id);
    const setClause = setParts.join(', ');
    const query = 'UPDATE variants SET ' + setClause + ' WHERE id = $' + idx + ' RETURNING *';
    const result = await pool.query(query, values);
    return res.status(200).json({ message: 'Variant updated.', variant: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.deleteVariant = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE variants SET deleted_at = NOW() WHERE id = $1', [id]);
    return res.status(200).json({ message: 'Variant soft-deleted.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
