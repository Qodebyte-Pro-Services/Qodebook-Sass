const pool = require('../config/db');
const uploadToFirebase = require('../utils/uploadToFireBase');

exports.generateVariants = async (req, res) => {
  try {
    const { id: product_id } = req.params;
    const { variants } = req.body; 
    if (!variants || !Array.isArray(variants) || variants.length === 0) return res.status(400).json({ message: 'Variants array required.' });
    const inserted = [];
    
      let imageUrl = null;

    if (req.file) {
      imageUrl = await uploadToFirebase(req.file);
    }
    for (const v of variants) {
      const skuCheck = await pool.query('SELECT * FROM variants WHERE sku = $1', [v.sku]);
      if (skuCheck.rows.length > 0) return res.status(409).json({ message: `SKU ${v.sku} already exists.` });
      const imageUrl = uploadedImageUrl || v.image_url || null;
      const result = await pool.query(
        'INSERT INTO variants (product_id, attributes, cost_price, selling_price, quantity, threshold, sku, image_url, expiry_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
        [product_id, JSON.stringify(v.attributes), v.cost_price, v.selling_price, v.quantity, v.threshold, v.sku, imageUrl, v.expiry_date]
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
    const result = await pool.query('SELECT * FROM variants WHERE product_id = $1', [product_id]);
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
    WHERE b.user_id = $1
  `, [user_id]);

  return res.status(200).json({ variants: result.rows });
};

exports.getVariantByProduct = async (req, res) => {
  try {
    const { productId, variantId } = req.params;

    const result = await pool.query(
      'SELECT * FROM variants WHERE id = $1 AND product_id = $2',
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
    const result = await pool.query('SELECT * FROM variants WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Variant not found' });
    }

    return res.status(200).json({ variant: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
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
      finalImageUrl = await uploadToFirebase(req.file);
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
    await pool.query('DELETE FROM variants WHERE id = $1', [id]);
    return res.status(200).json({ message: 'Variant deleted.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
