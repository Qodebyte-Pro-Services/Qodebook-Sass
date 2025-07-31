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

      // Check if attribute already exists
      const check = await pool.query(
        'SELECT * FROM attributes WHERE business_id = $1 AND LOWER(name) = LOWER($2)',
        [business_id, name]
      );

      if (check.rows.length > 0) {
        createdAttributes.push({ name, status: 'exists' });
        continue;
      }

      // Create attribute
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
