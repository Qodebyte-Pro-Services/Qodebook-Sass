
const pool = require('../config/db');
// const uploadToFirebase = require('../utils/uploadToFireBase');
const {uploadToCloudinary, uploadFilesToCloudinary} = require('../utils/uploadToCloudinary');

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
  const { product_name, attributes, separator, base_sku } = req.body;

  if (!product_name) {
    return res.status(400).json({ message: 'product_name is required.' });
  }

  if (!attributes || !Array.isArray(attributes) || attributes.length === 0) {
    const name = product_name;
    const sku = (base_sku || product_name).replace(/\s+/g, '').toUpperCase();
    return res.json({ variants: [{ name, sku }] });
  }

  const sep = typeof separator === 'string' ? separator : ' - ';

  
  const combine = (arr) =>
    arr.reduce(
      (acc, curr) => acc.flatMap(a => curr.values.map(v => [...a, v])),
      [[]]
    );

  const combos = combine(attributes);

  const variants = combos.map(combo => {
    const variantName = [product_name, ...combo].join(sep);
    const skuParts = [base_sku || product_name, ...combo].map(p =>
      p.replace(/\s+/g, '').toUpperCase()
    );
    const sku = skuParts.join('-');
    return { name: variantName, sku };
  });

  return res.json({ variants });
};



exports.generateVariants = async (req, res) => {
  try {
    const { id: product_id } = req.params;
    const variants = typeof req.body.variants === 'string' 
      ? JSON.parse(req.body.variants) 
      : req.body.variants;

    if (!variants || !Array.isArray(variants) || variants.length === 0) {
      return res.status(400).json({ message: 'Variants array required.' });
    }

    const business_id = req.business_id; 
    const branch_id = req.branch_id || null; 
    const isStaff = !!req.user?.staff_id;
    const recorded_by = isStaff ? String(req.user.staff_id) : String(req.user.user_id || req.user.id);
    const recorded_by_type = isStaff ? 'staff' : 'user';

    const productRes = await pool.query(
      'SELECT * FROM products WHERE id = $1 AND business_id = $2',
      [product_id, business_id]
    );
    if (productRes.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found for this business.' });
    }

    const inserted = [];
    const inventoryLogs = [];

    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      const skuCheck = await pool.query('SELECT 1 FROM variants WHERE sku = $1', [v.sku]);
      if (skuCheck.rows.length > 0) {
        return res.status(409).json({ message: `SKU ${v.sku} already exists.` });
      }
      const attrComboCheck = await pool.query(
        'SELECT 1 FROM variants WHERE product_id = $1 AND attributes = $2',
        [product_id, JSON.stringify(v.attributes || {})]
      );
      if (attrComboCheck.rows.length > 0) {
        return res.status(409).json({ message: 'Variant with this attribute combination already exists.' });
      }
      const fileKey = `variants[${i}][image_url]`;
      const variantFiles = (req.files || []).filter(f => f.fieldname === fileKey);
      let variantImages = [];
      if (variantFiles.length > 0) {
        variantImages = await uploadFilesToCloudinary(variantFiles);
      } else if (v.image_url) {
        variantImages = Array.isArray(v.image_url) ? v.image_url : [v.image_url];
      }
      variantImages = [...new Set(variantImages)];
      const result = await pool.query(
        `INSERT INTO variants 
          (product_id, attributes, cost_price, selling_price, quantity, threshold, sku, image_url, expiry_date, barcode, custom_price) 
         VALUES 
          ($1, $2::jsonb, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11) 
         RETURNING *`,
        [
          product_id,
          v.attributes ? JSON.stringify(v.attributes) : '{}',
          v.cost_price || 0,
          v.selling_price || 0,
          v.quantity || 0,
          v.threshold || 0,
          v.sku,
          JSON.stringify(variantImages),
          v.expiry_date || null,
          v.barcode || null,
          v.custom_price || null
        ]
      );
      const variant = result.rows[0];
      inserted.push(variant);
      if (variant.quantity > 0) {
        inventoryLogs.push([
          variant.id,
          'restock',
          variant.quantity,
           'increase', 
          'Initial stock on variant creation',
          business_id,
          branch_id,
         recorded_by,
         recorded_by_type
        ]);
      }
    }
    if (inventoryLogs.length > 0) {
      const placeholders = inventoryLogs
         .map(
    (_, idx) =>
      `($${idx * 9 + 1}, $${idx * 9 + 2}, $${idx * 9 + 3}, $${idx * 9 + 4}, $${idx * 9 + 5}, $${idx * 9 + 6}, $${idx * 9 + 7}, $${idx * 9 + 8}, $${idx * 9 + 9})`
  )
  .join(', ');
      const flatValues = inventoryLogs.flat();
      await pool.query(
       `INSERT INTO inventory_logs 
     (variant_id, type, quantity, reason, note, business_id, branch_id, recorded_by, recorded_by_type) 
      VALUES ${placeholders}`,
        flatValues
      );
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
    const result = await pool.query(
      'SELECT * FROM variants WHERE product_id = $1',
      [product_id]
    );
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

    
    const currentRes = await pool.query('SELECT * FROM variants WHERE id = $1', [id]);
    if (currentRes.rows.length === 0) {
      return res.status(404).json({ message: 'Variant not found.' });
    }
    let existingImages = currentRes.rows[0].image_url || [];

   
    const uploadedFiles = (req.files || []).filter(f => f.fieldname === 'image_url');
    let uploadedImages = [];
    if (uploadedFiles.length > 0) {
      uploadedImages = await uploadFilesToCloudinary(uploadedFiles);
    }

    
    const removeImages = req.body.remove_images
      ? Array.isArray(req.body.remove_images)
        ? req.body.remove_images
        : [req.body.remove_images]
      : [];

    existingImages = existingImages.filter(img => !removeImages.includes(img));

   
    let finalImages = [...existingImages, ...uploadedImages];

   
    if (req.body.replace_images === 'true') {
      finalImages = uploadedImages;
    }

    finalImages = [...new Set(finalImages)];

   
    let setParts = [];
    let values = [];
    let idx = 1;

    const updatableFields = [
      'attributes', 'cost_price', 'selling_price', 'quantity', 'threshold', 
      'sku', 'barcode', 'expiry_date', 'custom_price'
    ];

    for (const field of updatableFields) {
      if (req.body[field] !== undefined) {
        setParts.push(`${field} = $${idx}`);
        values.push(field === 'attributes' ? JSON.stringify(req.body[field]) : req.body[field]);
        idx++;
      }
    }

   
    if (uploadedImages.length > 0 || removeImages.length > 0 || req.body.replace_images === 'true') {
      setParts.push(`image_url = $${idx}`);
      values.push(finalImages);
      idx++;
    }

    setParts.push('updated_at = NOW()');

    values.push(id);
    const query = `UPDATE variants SET ${setParts.join(', ')} WHERE id = $${idx} RETURNING *`;

    const result = await pool.query(query, values);

    return res.status(200).json({ message: 'Variant updated.', variant: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};




exports.updateBarcode = async (req, res) => {
  const { id } = req.params;
  const { barcode } = req.body;

  if (!barcode) return res.status(400).json({ message: 'Barcode is required.' });

  try {
    const result = await pool.query(
      'UPDATE variants SET barcode = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [barcode, id]
    );
    return res.status(200).json({ message: 'Barcode updated.', variant: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update barcode.' });
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
