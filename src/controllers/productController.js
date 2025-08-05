
const pool = require('../config/db');
// const uploadToFirebase = require('../utils/uploadToFireBase');
const uploadToCloudinary = require('../utils/uploadToCloudinary');
const AuditService = require('../services/auditService');

exports.countProductsInStock = async (req, res) => {
  try {
    const { business_id, branch_id } = req.query;
    let query = 'SELECT COUNT(*) FROM products';
    let params = [];
    if (business_id) {
      query += ' WHERE business_id = $1';
      params.push(business_id);
      if (branch_id) {
        query += ' AND branch_id = $2';
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

exports.createProduct = async (req, res) => {
  try {
    const { business_id, category_id, name, brand, description, base_sku, taxable, threshold } = req.body;
  let image_url = null;
    if (req.file) {
      image_url = await uploadToCloudinary(req.file);
    } else if (req.body.image_url) {
      image_url = req.body.image_url;
    }
    if (!business_id || !category_id || !name) return res.status(400).json({ message: 'business_id, category_id, and name are required.' });
    const check = await pool.query('SELECT * FROM products WHERE business_id = $1 AND LOWER(name) = LOWER($2)', [business_id, name]);
    if (check.rows.length > 0) return res.status(409).json({ message: 'Product name already exists.' });
    const result = await pool.query(
      'INSERT INTO products (business_id, category_id, name, brand, description, base_sku, image_url, taxable, threshold) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [business_id, category_id, name, brand, description, base_sku, image_url, taxable, threshold]
    );
   
    const product = result.rows[0];
    if (!req.body.attributes || !Array.isArray(req.body.attributes) || req.body.attributes.length === 0) {
      await pool.query(
        'INSERT INTO variants (product_id, attributes, cost_price, selling_price, quantity, threshold, sku, image_url, expiry_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [product.id, JSON.stringify([]), req.body.cost_price || 0, req.body.selling_price || 0, req.body.quantity || 0, req.body.threshold || 0, req.body.base_sku || product.name, image_url, null]
      );
    }

    await AuditService.logProductAction(
      'create',
      product.id,
      product.name,
      business_id,
      req.user,
      null,
      product,
      req
    );

    return res.status(201).json({ message: 'Product created.', product });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.listProducts = async (req, res) => {
  try {
   
    const attributeFilters = Array.isArray(req.query.attribute)
      ? req.query.attribute
      : req.query.attribute
        ? [req.query.attribute]
        : [];

    let query = 'SELECT DISTINCT p.* FROM products p';
    let params = [];
    let joins = '';
    let wheres = [];
    let idx = 1;

    if (attributeFilters.length > 0) {
      joins += ' JOIN variants v ON v.product_id = p.id';
      for (const filter of attributeFilters) {
        const [attrName, attrValue] = filter.split(':');
        if (attrName && attrValue) {
          wheres.push(`EXISTS (SELECT 1 FROM jsonb_array_elements(v.attributes) elem WHERE elem->>'name' = $${idx} AND elem->>'value' = $${idx + 1})`);
          params.push(attrName, attrValue);
          idx += 2;
        }
      }
    }

    if (joins) query += joins;
    if (wheres.length > 0) query += ' WHERE ' + wheres.join(' AND ');

    const result = await pool.query(query, params);
    return res.status(200).json({ products: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Product not found.' });
    return res.status(200).json({ product: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, brand, description, base_sku, taxable, threshold, category_id } = req.body;
      let image_url = null;
    if (req.file) {
      image_url = await uploadToCloudinary(req.file);
    } else if (req.body.image_url) {
      image_url = req.body.image_url;
    }


    const currentProduct = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (currentProduct.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    let setParts = [];
    let values = [];
    let idx = 1;
    if (name) { setParts.push('name = $' + idx); values.push(name); idx++; }
    if (brand) { setParts.push('brand = $' + idx); values.push(brand); idx++; }
    if (description) { setParts.push('description = $' + idx); values.push(description); idx++; }
    if (base_sku) { setParts.push('base_sku = $' + idx); values.push(base_sku); idx++; }
    if (image_url) { setParts.push('image_url = $' + idx); values.push(image_url); idx++; }
    if (taxable !== undefined) { setParts.push('taxable = $' + idx); values.push(taxable); idx++; }
    if (threshold !== undefined) { setParts.push('threshold = $' + idx); values.push(threshold); idx++; }
    if (category_id) { setParts.push('category_id = $' + idx); values.push(category_id); idx++; }
    setParts.push('updated_at = NOW()');
    if (setParts.length === 1) return res.status(400).json({ message: 'No fields to update.' });
    values.push(id);
    const setClause = setParts.join(', ');
    const query = 'UPDATE products SET ' + setClause + ' WHERE id = $' + idx + ' RETURNING *';
    const result = await pool.query(query, values);
    
    const updatedProduct = result.rows[0];

  
    await AuditService.logProductAction(
      'update',
      updatedProduct.id,
      updatedProduct.name,
      updatedProduct.business_id,
      req.user,
      currentProduct.rows[0],
      updatedProduct,
      req
    );

    return res.status(200).json({ message: 'Product updated.', product: updatedProduct });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    
    const productResult = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (productResult.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    
    const product = productResult.rows[0];
    
    await pool.query('UPDATE products SET deleted_at = NOW() WHERE id = $1', [id]);

   
    await AuditService.logProductAction(
      'delete',
      product.id,
      product.name,
      product.business_id,
      req.user,
      product,
      null,
      req
    );

    return res.status(200).json({ message: 'Product soft-deleted.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.getProductsByCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM products WHERE category_id = $1', [id]);
    return res.status(200).json({ products: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.getProductsByBusiness = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM products WHERE business_id = $1', [id]);
    return res.status(200).json({ products: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.createProductWithVariants = async (req, res) => {
  try {
    const {
      business_id,
      category_id,
      name,
      brand,
      description,
      base_sku,
      taxable,
      threshold,
      attributes = [],
      variants = [],   
    } = req.body;
    let image_url = null;
    if (req.file) {
      image_url = await uploadToCloudinary(req.file);
    } else if (req.body.image_url) {
      image_url = req.body.image_url;
    }
    if (!business_id || !category_id || !name) {
      return res.status(400).json({ message: 'business_id, category_id, and name are required.' });
    }

    const check = await pool.query('SELECT * FROM products WHERE business_id = $1 AND LOWER(name) = LOWER($2)', [business_id, name]);
    if (check.rows.length > 0) {
      return res.status(409).json({ message: 'Product name already exists.' });
    }
  
    const result = await pool.query(
      'INSERT INTO products (business_id, category_id, name, brand, description, base_sku, image_url, taxable, threshold) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [business_id, category_id, name, brand, description, base_sku, image_url, taxable, threshold]
    );
    const product = result.rows[0];

   
    async function ensureAttributeAndValues(attr) {
    
      let attrRes = await pool.query('SELECT * FROM attributes WHERE business_id = $1 AND LOWER(name) = LOWER($2)', [business_id, attr.name.toLowerCase()]);
      let attribute;
      if (attrRes.rows.length === 0) {
        const insertAttr = await pool.query('INSERT INTO attributes (business_id, name) VALUES ($1, $2) RETURNING *', [business_id, attr.name]);
        attribute = insertAttr.rows[0];
      } else {
        attribute = attrRes.rows[0];
      }

      let valueIds = [];
      for (const val of attr.values) {
        let valRes = await pool.query('SELECT * FROM attribute_values WHERE attribute_id = $1 AND LOWER(value) = LOWER($2)', [attribute.id, val.toLowerCase()]);
        let value;
        if (valRes.rows.length === 0) {
          const insertVal = await pool.query('INSERT INTO attribute_values (attribute_id, value) VALUES ($1, $2) RETURNING *', [attribute.id, val]);
          value = insertVal.rows[0];
        } else {
          value = valRes.rows[0];
        }
        valueIds.push({ attribute_id: attribute.id, value_id: value.id, name: attribute.name, value: value.value });
      }
      return valueIds;
    }

   
    let attributeMatrix = [];
    for (const attr of attributes) {
      const vals = await ensureAttributeAndValues(attr);
      attributeMatrix.push({ name: attr.name, values: vals });
    }

    
    function cartesian(arr) {
      return arr.reduce((a, b) => a.flatMap(d => b.values.map(e => d.concat([e]))), [[]]);
    }

    let finalVariants = [];
    if (!variants.length && attributeMatrix.length) {
      const combos = cartesian(attributeMatrix);
      finalVariants = combos.map((combo, idx) => {
       
        const attrObj = {};
        combo.forEach(c => { attrObj[c.name] = c.value; });
        return {
          attributes: attrObj,
          sku: base_sku ? `${base_sku}-${idx+1}` : `${name.replace(/\s+/g, '').toUpperCase()}-${idx+1}`,
          cost_price: 0,
          selling_price: 0,
          quantity: 0,
          barcode: null,
          image_url: image_url || null,
        };
      });
    } else {
      finalVariants = variants;
    }

   
    let createdVariants = [];
    for (const v of finalVariants) {
    
      const skuCheck = await pool.query('SELECT * FROM variants WHERE sku = $1', [v.sku]);
      if (skuCheck.rows.length > 0) {
        return res.status(409).json({ message: `SKU ${v.sku} already exists.` });
      }
     
      let attrArr = [];
      for (const [attrName, val] of Object.entries(v.attributes)) {
      
        const attr = attributeMatrix.find(a => a.name === attrName);
        if (attr) {
          const valObj = attr.values.find(x => x.value === val);
          if (valObj) {
            attrArr.push({ attribute_id: valObj.attribute_id, value_id: valObj.value_id, name: attrName, value: val });
          }
        }
      }
   
      const result = await pool.query(
        'INSERT INTO variants (product_id, attributes, cost_price, selling_price, quantity, threshold, sku, image_url, expiry_date, barcode) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
        [product.id, JSON.stringify(attrArr), v.cost_price || 0, v.selling_price || 0, v.quantity || 0, threshold || 0, v.sku, v.image_url || image_url, null, v.barcode || null]
      );
      createdVariants.push(result.rows[0]);
    }

   
    await AuditService.logProductAction(
      'create',
      product.id,
      product.name,
      business_id,
      req.user,
      null,
      { ...product, variants: createdVariants },
      req
    );

    return res.status(201).json({ message: 'Product with variants created.', product, variants: createdVariants });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
