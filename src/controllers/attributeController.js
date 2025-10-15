const pool = require('../config/db');

exports.createAttribute = async (req, res) => {
  try {
    const { business_id, name } = req.body;
    if (!business_id || !name) return res.status(400).json({ message: 'business_id and name are required.' });
   
    const check = await pool.query('SELECT * FROM attributes WHERE business_id = $1 AND LOWER(name) = LOWER($2)', [business_id, name]);
    if (check.rows.length > 0) return res.status(409).json({ message: 'Attribute name already exists.' });
    const result = await pool.query('INSERT INTO attributes (business_id, name) VALUES ($1, $2) RETURNING *', [business_id, name]);
    return res.status(201).json({ message: 'Attribute created.', attribute: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.listAttributes = async (req, res) => {
  try {
    const { business_id } = req.query;
    let result;
    if (business_id) {
      result = await pool.query('SELECT * FROM attributes WHERE business_id = $1', [business_id]);
    } else {
      result = await pool.query('SELECT * FROM attributes');
    }
    
    const attributes = result.rows;
    for (let attr of attributes) {
      const valuesRes = await pool.query('SELECT * FROM attribute_values WHERE attribute_id = $1', [attr.id]);
      attr.values = valuesRes.rows;
    }
    return res.status(200).json({ attributes });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.addAttributeValue = async (req, res) => {
  try {
    const { id } = req.params;
    const { value } = req.body;
    if (!value) return res.status(400).json({ message: 'Value is required.' });
    const check = await pool.query('SELECT * FROM attribute_values WHERE attribute_id = $1 AND LOWER(value) = LOWER($2)', [id, value]);
    if (check.rows.length > 0) return res.status(409).json({ message: 'Attribute value already exists.' });
    const result = await pool.query('INSERT INTO attribute_values (attribute_id, value) VALUES ($1, $2) RETURNING *', [id, value]);
    return res.status(201).json({ message: 'Attribute value added.', value: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.createAttributesBulk = async (req, res) => {
  const { business_id, attributes } = req.body;

  if (!business_id || !Array.isArray(attributes)) {
    return res.status(400).json({ message: 'business_id and attributes array are required.' });
  }

  try {
    const createdAttributes = [];

    for (const attr of attributes) {
      const { name, values } = attr;

     
      const check = await pool.query(
        'SELECT * FROM attributes WHERE business_id = $1 AND LOWER(name) = LOWER($2)',
        [business_id, name]
      );

      if (check.rows.length > 0) {
        createdAttributes.push({ name, status: 'exists' });
        continue;
      }

      
      const attributeRes = await pool.query(
        'INSERT INTO attributes (business_id, name) VALUES ($1, $2) RETURNING *',
        [business_id, name]
      );
      const attribute = attributeRes.rows[0];

      const addedValues = [];

      if (Array.isArray(values)) {
        for (const value of values) {
          const valueCheck = await pool.query(
            'SELECT * FROM attribute_values WHERE attribute_id = $1 AND LOWER(value) = LOWER($2)',
            [attribute.id, value]
          );
          if (valueCheck.rows.length === 0) {
            const valueRes = await pool.query(
              'INSERT INTO attribute_values (attribute_id, value) VALUES ($1, $2) RETURNING *',
              [attribute.id, value]
            );
            addedValues.push(valueRes.rows[0]);
          }
        }
      }

      createdAttributes.push({ attribute, values: addedValues });
    }

    return res.status(201).json({
      message: 'Attributes processed.',
      data: createdAttributes,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.getAttribute = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM attributes WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Attribute not found.' });
    const attribute = result.rows[0];
    const valuesRes = await pool.query('SELECT * FROM attribute_values WHERE attribute_id = $1', [id]);
    attribute.values = valuesRes.rows;
    return res.status(200).json({ attribute });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.deleteAttribute = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM attributes WHERE id = $1', [id]);
    return res.status(200).json({ message: 'Attribute deleted.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.getAttributeValue = async (req, res) => {
  try {
    const { id, valueId } = req.params;
    const result = await pool.query('SELECT * FROM attribute_values WHERE id = $1 AND attribute_id = $2', [valueId, id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Attribute value not found.' });
    return res.status(200).json({ value: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.deleteAttributeValue = async (req, res) => {
  try {
    const { id, valueId } = req.params;
    await pool.query('DELETE FROM attribute_values WHERE id = $1 AND attribute_id = $2', [valueId, id]);
    return res.status(200).json({ message: 'Attribute value deleted.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.updateAttribute = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const {
      name,
      values_to_add = [],        // array of strings
      values_to_update = [],     // array of { id: valueId, value: 'newName' }
      values_to_remove = []      // array of valueIds
    } = req.body;

    if (!name && !values_to_add.length && !values_to_update.length && !values_to_remove.length) {
      return res.status(400).json({ message: 'Nothing to update. Provide name and/or values_to_add/values_to_update/values_to_remove.' });
    }

    await client.query('BEGIN');

    // Ensure attribute exists and get business_id
    const attrRes = await client.query('SELECT * FROM attributes WHERE id = $1', [id]);
    if (attrRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Attribute not found.' });
    }
    const attribute = attrRes.rows[0];
    const business_id = attribute.business_id;

    // If changing name, ensure no conflict within same business
    if (name) {
      const nameCheck = await client.query(
        'SELECT 1 FROM attributes WHERE business_id = $1 AND LOWER(name) = LOWER($2) AND id != $3',
        [business_id, name, id]
      );
      if (nameCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ message: 'Attribute name already exists for this business.' });
      }
      await client.query('UPDATE attributes SET name = $1 WHERE id = $2', [name, id]);
    }

    const added = [];
    const updated = [];
    const removed = [];
    const skipped = [];

    // Remove values (if any)
    if (Array.isArray(values_to_remove) && values_to_remove.length > 0) {
      // delete only values that belong to this attribute
      const delRes = await client.query(
        'DELETE FROM attribute_values WHERE attribute_id = $1 AND id = ANY($2::int[]) RETURNING id',
        [id, values_to_remove]
      );
      for (const r of delRes.rows) removed.push(r.id);
    }

    // Update existing values (rename)
    if (Array.isArray(values_to_update) && values_to_update.length > 0) {
      for (const v of values_to_update) {
        if (!v || !v.id || !v.value) {
          skipped.push({ reason: 'invalid_payload', item: v });
          continue;
        }
        // ensure the value belongs to this attribute
        const belong = await client.query('SELECT 1 FROM attribute_values WHERE id = $1 AND attribute_id = $2', [v.id, id]);
        if (belong.rows.length === 0) {
          skipped.push({ reason: 'not_found_or_mismatch_attribute', item: v });
          continue;
        }
        // check duplicate (case-insensitive) within attribute excluding this id
        const dup = await client.query(
          'SELECT 1 FROM attribute_values WHERE attribute_id = $1 AND LOWER(value) = LOWER($2) AND id != $3',
          [id, v.value, v.id]
        );
        if (dup.rows.length > 0) {
          skipped.push({ reason: 'duplicate_value', item: v });
          continue;
        }
        const upd = await client.query(
          'UPDATE attribute_values SET value = $1 WHERE id = $2 AND attribute_id = $3 RETURNING *',
          [v.value, v.id, id]
        );
        updated.push(upd.rows[0]);
      }
    }

    // Add new values
    if (Array.isArray(values_to_add) && values_to_add.length > 0) {
      for (const val of values_to_add) {
        if (!val || typeof val !== 'string') {
          skipped.push({ reason: 'invalid_value', item: val });
          continue;
        }
        // prevent duplicate (case-insensitive) within this attribute
        const exist = await client.query(
          'SELECT 1 FROM attribute_values WHERE attribute_id = $1 AND LOWER(value) = LOWER($2)',
          [id, val]
        );
        if (exist.rows.length > 0) {
          skipped.push({ reason: 'duplicate_value', item: val });
          continue;
        }
        const ins = await client.query(
          'INSERT INTO attribute_values (attribute_id, value) VALUES ($1, $2) RETURNING *',
          [id, val]
        );
        added.push(ins.rows[0]);
      }
    }

    await client.query('COMMIT');

    // Fetch latest attribute and its values
    const freshAttrRes = await client.query('SELECT * FROM attributes WHERE id = $1', [id]);
    const valuesRes = await client.query('SELECT * FROM attribute_values WHERE attribute_id = $1 ORDER BY id', [id]);

    return res.status(200).json({
      message: 'Attribute updated.',
      attribute: freshAttrRes.rows[0],
      values: valuesRes.rows,
      summary: { added, updated, removed, skipped }
    });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (e) { /* ignore */ }
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  } finally {
    client.release();
  }
}