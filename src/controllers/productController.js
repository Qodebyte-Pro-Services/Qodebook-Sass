
const pool = require('../config/db');
// const uploadToFirebase = require('../utils/uploadToFireBase');
const {uploadToCloudinary, uploadFilesToCloudinary} = require('../utils/uploadToCloudinary');
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
    const {
      business_id,
      category_id,
      name,
      brand,
      description,
      base_sku,
      taxable,
      threshold,
      unit,
      hasVariation
    } = req.body;

    let productImages = await uploadFilesToCloudinary(req.files || req.file);

    if (!productImages.length && req.body.image_url) {
      productImages = Array.isArray(req.body.image_url) ? req.body.image_url : [req.body.image_url];
    }

    productImages = [...new Set(productImages)];

    if (!business_id || !category_id || !name) {
      return res.status(400).json({ message: 'business_id, category_id, and name are required.' });
    }

    const check = await pool.query(
      'SELECT * FROM products WHERE business_id = $1 AND LOWER(name) = LOWER($2)',
      [business_id, name]
    );
    if (check.rows.length > 0) {
      return res.status(409).json({ message: 'Product name already exists.' });
    }

    const result = await pool.query(
      `INSERT INTO products 
        (business_id, category_id, name, brand, description, base_sku, image_url, taxable, threshold, unit, "hasVariation") 
       VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
       RETURNING *`,
      [
        business_id,
        category_id,
        name,
        brand,
        description,
        base_sku,
        productImages,
        taxable,
        threshold,
        unit,
        hasVariation || false
      ]
    );

    const product = result.rows[0];

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

    let productImages = await uploadFilesToCloudinary(req.files || req.file);

    if (!productImages.length && req.body.image_url) {
      productImages = Array.isArray(req.body.image_url) ? req.body.image_url : [req.body.image_url];
    }

    const currentProduct = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (currentProduct.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    let setParts = [];
    let values = [];
    let idx = 1;

    const fields = [
      'name', 'brand', 'description', 'base_sku', 'taxable', 'threshold',
      'category_id', 'unit', 'hasVariation'
    ];

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        setParts.push(`"${field}" = $${idx}`);
        values.push(req.body[field]);
        idx++;
      }
    }

    if (productImages.length) {
      setParts.push(`image_url = $${idx}`);
      values.push(productImages);
      idx++;
    }

    setParts.push('updated_at = NOW()');

    if (setParts.length === 1) {
      return res.status(400).json({ message: 'No fields to update.' });
    }

    values.push(id);
    const setClause = setParts.join(', ');
    const query = `UPDATE products SET ${setClause} WHERE id = $${idx} RETURNING *`;

    const result = await pool.query(query, values);
    const updatedProduct = result.rows[0];

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
      unit,
      hasVariation,
      attributes = [],
      variants = []
    } = req.body;

    
    const parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
    const parsedAttributes = typeof attributes === 'string' ? JSON.parse(attributes) : attributes;

   
    let productImages = [];
    if (req.files?.image_url) {
      productImages = await uploadFilesToCloudinary(req.files.image_url);
    } else if (req.body.image_url) {
      productImages = Array.isArray(req.body.image_url) ? req.body.image_url : [req.body.image_url];
    }
    productImages = [...new Set(productImages)];

    
    if (!business_id || !category_id || !name || !description || !brand) {
      return res.status(400).json({
        message: "business_id, category_id, description, brand and name are required."
      });
    }

   
    const check = await pool.query(
      "SELECT * FROM products WHERE business_id = $1 AND LOWER(name) = LOWER($2)",
      [business_id, name]
    );
    if (check.rows.length > 0) {
      return res.status(409).json({ message: "Product name already exists." });
    }

   
    const result = await pool.query(
      `INSERT INTO products 
        (business_id, category_id, name, brand, description, base_sku, image_url, taxable, threshold, unit, "hasVariation") 
       VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
       RETURNING *`,
      [
        business_id,
        category_id,
        name,
        brand,
        description,
        base_sku,
        productImages,
        taxable,
        threshold,
        unit,
        hasVariation || false
      ]
    );
    const product = result.rows[0];

    
    async function ensureAttributeAndValues(attr) {
      let attrRes = await pool.query(
        "SELECT * FROM attributes WHERE business_id = $1 AND LOWER(name) = LOWER($2)",
        [business_id, attr.name.toLowerCase()]
      );
      let attribute =
        attrRes.rows.length === 0
          ? (
              await pool.query(
                "INSERT INTO attributes (business_id, name) VALUES ($1, $2) RETURNING *",
                [business_id, attr.name]
              )
            ).rows[0]
          : attrRes.rows[0];

      let valueIds = [];
      for (const val of attr.values) {
        let valRes = await pool.query(
          "SELECT * FROM attribute_values WHERE attribute_id = $1 AND LOWER(value) = LOWER($2)",
          [attribute.id, val.toLowerCase()]
        );
        let value =
          valRes.rows.length === 0
            ? (
                await pool.query(
                  "INSERT INTO attribute_values (attribute_id, value) VALUES ($1, $2) RETURNING *",
                  [attribute.id, val]
                )
              ).rows[0]
            : valRes.rows[0];

        valueIds.push({
          attribute_id: attribute.id,
          value_id: value.id,
          name: attribute.name,
          value: value.value
        });
      }
      return valueIds;
    }

    let attributeMatrix = [];
    for (const attr of parsedAttributes) {
      const vals = await ensureAttributeAndValues(attr);
      attributeMatrix.push({ name: attr.name, values: vals });
    }

    function cartesian(arr) {
      return arr.reduce(
        (a, b) => a.flatMap((d) => b.values.map((e) => d.concat([e]))),
        [[]]
      );
    }

    let finalVariants = [];
    if (!parsedVariants.length && attributeMatrix.length) {
      const combos = cartesian(attributeMatrix);
      finalVariants = combos.map((combo, idx) => {
        const attrObj = {};
        combo.forEach((c) => { attrObj[c.name] = c.value; });
        return {
          attributes: attrObj,
          sku: base_sku
            ? `${base_sku}-${idx + 1}`
            : `${name.replace(/\s+/g, "").toUpperCase()}-${idx + 1}`,
          cost_price: 0,
          selling_price: 0,
          quantity: 0,
          barcode: null
        };
      });
    } else {
      finalVariants = parsedVariants;
    }

    let createdVariants = [];

   
    for (let i = 0; i < finalVariants.length; i++) {
      const v = finalVariants[i];

     
      const skuCheck = await pool.query("SELECT * FROM variants WHERE sku = $1", [v.sku]);
      if (skuCheck.rows.length > 0) {
        return res.status(409).json({ message: `SKU ${v.sku} already exists.` });
      }

      
      let attrArr = [];
      for (const [attrName, val] of Object.entries(v.attributes || {})) {
        const attr = attributeMatrix.find((a) => a.name === attrName);
        if (attr) {
          const valObj = attr.values.find((x) => x.value === val);
          if (valObj) {
            attrArr.push({
              attribute_id: valObj.attribute_id,
              value_id: valObj.value_id,
              name: attrName,
              value: val
            });
          }
        }
      }

     
      const fileKey = `variants[${i}][image_url]`;
      let variantImages = [];
      if (req.files?.[fileKey]) {
        variantImages = await uploadFilesToCloudinary(req.files[fileKey]);
      } else if (v.image_url) {
        variantImages = Array.isArray(v.image_url) ? v.image_url : [v.image_url];
      } else {
        variantImages = productImages;
      }
      variantImages = [...new Set(variantImages)];

      
      const variantResult = await pool.query(
        `INSERT INTO variants 
        (product_id, attributes, cost_price, selling_price, quantity, threshold, sku, image_url, expiry_date, barcode) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [
          product.id,
          attrArr,
          v.cost_price || 0,
          v.selling_price || 0,
          v.quantity || 0,
          threshold || 0,
          v.sku,
          variantImages,
          null,
          v.barcode || null
        ]
      );
      createdVariants.push(variantResult.rows[0]);
    }

    return res.status(201).json({
      message: "Product with variants created.",
      product,
      variants: createdVariants
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error.", details: err.message });
  }
};


