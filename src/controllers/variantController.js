
const pool = require('../config/db');
// const uploadToFirebase = require('../utils/uploadToFireBase');
const {uploadToCloudinary, uploadFilesToCloudinary, deleteFileFromCloudinary} = require('../utils/uploadToCloudinary');

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
  try {
    const { business_id } = req.query;

    if (!business_id) {
      return res.status(400).json({ message: 'business_id is required' });
    }

    const result = await pool.query(`
      SELECT v.*
      FROM variants v
      JOIN products p ON v.product_id = p.id
      WHERE p.business_id = $1
    `, [business_id]);

    return res.status(200).json({ variants: result.rows });

  } catch (err) {
    console.error('Error fetching variants by business:', err);
    return res.status(500).json({ message: 'Server error' });
  }
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
    const { variant_id } = req.params;

   
    const variantRes = await pool.query(
      "SELECT * FROM variants WHERE id = $1",
      [variant_id]
    );
    if (variantRes.rows.length === 0) {
      return res.status(404).json({ message: "Variant not found." });
    }
    const currentVariant = variantRes.rows[0];

    
    const variantFiles = (req.files || []).filter(f => f.fieldname === "image_url");
    let uploadedImages = [];
    if (variantFiles.length > 0) {
      uploadedImages = await uploadFilesToCloudinary(variantFiles);
    }

    
    let existingImages = Array.isArray(currentVariant.image_url)
      ? currentVariant.image_url
      : [];

    
    const deleteImages = req.body.deleteImages
      ? Array.isArray(req.body.deleteImages)
        ? req.body.deleteImages
        : [req.body.deleteImages]
      : [];

    if (deleteImages.length > 0) {
      for (const public_id of deleteImages) {
        try {
          await deleteFileFromCloudinary(public_id);
          existingImages = existingImages.filter(img => img.public_id !== public_id);
        } catch (err) {
          console.error(`Failed to delete image ${public_id}:`, err.message);
        }
      }
    }

   
    
    let finalImages = [];
    if (req.body.replace_images === "true") {
      finalImages = uploadedImages;
    } else {
      finalImages = [...existingImages, ...uploadedImages];
      finalImages = finalImages.filter(
        (img, index, self) =>
          index === self.findIndex(i => i.public_id === img.public_id)
      );
    }

   
    const fields = [];
    const values = [];
    let idx = 1;

const castValue = (field, val) => {
  if (["quantity", "threshold"].includes(field)) return parseInt(val, 10);
  if (["cost_price", "selling_price"].includes(field)) return parseFloat(val);
  if (field === "attributes") return typeof val === "string" ? val : JSON.stringify(val);
  if (field === "expiry_date") {
    if (typeof val === "string") {
      // Handle DD/MM/YYYY or DD-MM-YYYY
      const parts = val.includes("/") ? val.split("/") : val.includes("-") ? val.split("-") : null;
      if (parts && parts.length === 3) {
        let [day, month, year] = parts.map(p => p.trim());
        // Swap if incorrectly ordered (e.g., 2025-16-10)
        if (year.length === 2) year = `20${year}`; // handle 25 => 2025
        if (day.length === 4) { // year came first
          [year, month, day] = [day, month, year];
        }
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
    }
    return val;
  }
  return val;
};
    const updatableFields = [
      "attributes", "cost_price", "selling_price", "quantity",
      "threshold", "sku", "expiry_date", "barcode"
    ];


    
    let quantityChanged = false;
    let oldQuantity = currentVariant.quantity;
    let newQuantity = oldQuantity;

    for (const field of updatableFields) {
      if (req.body[field] !== undefined) {
        const newVal = castValue(field, req.body[field]);
        if (JSON.stringify(newVal) !== JSON.stringify(currentVariant[field])) {
          fields.push(`"${field}" = $${idx}`);
          values.push(newVal);
          if (field === "quantity") {
            quantityChanged = true;
            newQuantity = newVal;
          }
          idx++;
        }
      }
    }

    
    let existingDbImages = [];
try {
  existingDbImages = typeof currentVariant.image_url === "string"
    ? JSON.parse(currentVariant.image_url)
    : currentVariant.image_url || [];
} catch {
  existingDbImages = currentVariant.image_url || [];
}

const areImagesSame =
  JSON.stringify(existingDbImages.map(i => i.public_id).sort()) ===
  JSON.stringify(finalImages.map(i => i.public_id).sort());

if (!areImagesSame) {
  fields.push(`image_url = $${idx}::jsonb`);
  values.push(JSON.stringify(finalImages));
  idx++;
}


    if (fields.length === 0) {
      return res.status(400).json({ message: "No changes detected." });
    }


    fields.push("updated_at = NOW()");
    values.push(variant_id);

    const query = `
      UPDATE variants
      SET ${fields.join(", ")}
      WHERE id = $${idx}
      RETURNING *`;

    const result = await pool.query(query, values);
    const updatedVariant = result.rows[0];

   
    if (quantityChanged && newQuantity !== oldQuantity) {
      let business_id = null;
      try {
        const prodRes = await pool.query(
          'SELECT business_id FROM products WHERE id = $1',
          [updatedVariant.product_id]
        );
        if (prodRes.rows.length > 0) {
          business_id = prodRes.rows[0].business_id;
        }
      } catch (e) {
        console.error('Failed to fetch business for variant:', e.message);
      }

    
      let branch_id = req.headers['x-branch'] || req.headers['x-branch-id'] || null;

      let diff = newQuantity - oldQuantity;
      let type = diff > 0 ? 'restock' : 'deduct';
      let reason = diff > 0 ? 'increase' : 'decrease';
      let note = `Quantity updated from ${oldQuantity} to ${newQuantity}`;

      const isStaff = !!req.user?.staff_id;
      const recorded_by = isStaff ? String(req.user.staff_id) : String(req.user.user_id || req.user.id);
      const recorded_by_type = isStaff ? 'staff' : 'user';

      await pool.query(
        `INSERT INTO inventory_logs
          (variant_id, type, quantity, reason, note, business_id, branch_id, recorded_by, recorded_by_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          updatedVariant.id,
          type,
          Math.abs(diff),
          reason,
          note,
          business_id,
          branch_id,
          recorded_by,
          recorded_by_type
        ]
      );
    }

    return res.status(200).json({
      message: "Variant updated successfully.",
      variant: updatedVariant
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error.", details: err.message });
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
