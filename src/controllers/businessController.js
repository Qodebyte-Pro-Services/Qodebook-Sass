const pool = require('../config/db');
const { sendBusinessCreatedEmail } = require('../services/emailService');
const bucket = require('../config/firebase');
const { v4: uuidv4 } = require('uuid'); 
const path = require('path');
// const uploadToFirebase = require('../utils/uploadToFireBase');
const uploadToCloudinary = require('../utils/uploadToCloudinary');


exports.createBusiness = async (req, res) => {
  try {
    const { business_name, business_type, address, business_phone } = req.body;
    const user_id = req.user.user_id;

     let logo_url = null;
    if (req.file) {
      logo_url = await uploadToCloudinary(req.file.buffer, req.file.originalname);
    } else if (req.body.logo_url) {
      logo_url = req.body.logo_url;
    }
   
    // let logo_url = null;
    //     if (req.file) {
    //   logo_url = await uploadToFirebase(req.file);
    // } else if (req.body.logo_url) {
    //   logo_url = req.body.logo_url;
    // }

    const check = await pool.query('SELECT * FROM businesses WHERE business_name = $1 OR business_phone = $2', [business_name, business_phone]);
    if (check.rows.length > 0) {
      return res.status(409).json({ message: 'Business name or phone already exists.' });
    }

    const insertQuery = `INSERT INTO businesses (user_id, business_name, business_type, address, business_phone, logo_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
    const result = await pool.query(insertQuery, [user_id, business_name, business_type, address, business_phone, logo_url]);
    const business = result.rows[0];

   
    const branch_name = `${business.business_name} Branch One`;
    const location = business.address;
    const branchInsertQuery = `INSERT INTO branches (business_id, branch_name, location, branch_manager) VALUES ($1, $2, $3, $4) RETURNING *`;
    const branchResult = await pool.query(branchInsertQuery, [business.id, branch_name, location, '']);
    const branch = branchResult.rows[0];

    try {
      await sendBusinessCreatedEmail(req.user.email, business.business_name);
    } catch (e) {
      console.error('Failed to send business creation email:', e);
    }

    return res.status(201).json({ message: 'Business created successfully.', business, branch });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};


exports.listBusinesses = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const result = await pool.query('SELECT * FROM businesses WHERE user_id = $1', [user_id]);
    return res.status(200).json({ businesses: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.getBusiness = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const business_id = req.params.id;
    const result = await pool.query('SELECT * FROM businesses WHERE id = $1 AND user_id = $2', [business_id, user_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Business not found.' });
    }
    return res.status(200).json({ business: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.updateBusiness = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const business_id = req.params.id;
    const { business_name, business_type, address, business_phone } = req.body;
  
  
    // let logo_url = null;
    // if (req.file) {
    //   logo_url = await uploadToFirebase(req.file);
    // } else if (req.body.logo_url) {
    //   logo_url = req.body.logo_url;
    // }

        let logo_url = null;
    if (req.file) {
      logo_url = await uploadToCloudinary(req.file.buffer, req.file.originalname);
    } else if (req.body.logo_url) {
      logo_url = req.body.logo_url;
    }


    const check = await pool.query('SELECT * FROM businesses WHERE id = $1 AND user_id = $2', [business_id, user_id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Business not found.' });
    }

    let setParts = [];
    let values = [];
    let idx = 1;
    if (business_name) { setParts.push('business_name = $' + idx); values.push(business_name); idx++; }
    if (business_type) { setParts.push('business_type = $' + idx); values.push(business_type); idx++; }
    if (address) { setParts.push('address = $' + idx); values.push(address); idx++; }
    if (business_phone) { setParts.push('business_phone = $' + idx); values.push(business_phone); idx++; }
    if (logo_url) { setParts.push('logo_url = $' + idx); values.push(logo_url); idx++; }
    setParts.push('updated_at = NOW()');
    if (setParts.length === 1) return res.status(400).json({ message: 'No fields to update.' });

    if (business_name || business_phone) {
      const uniqueCheck = await pool.query(
        'SELECT * FROM businesses WHERE (business_name = $1 OR business_phone = $2) AND id != $3',
        [business_name || '', business_phone || '', business_id]
      );
      if (uniqueCheck.rows.length > 0) {
        return res.status(409).json({ message: 'Business name or phone already exists.' });
      }
    }

    values.push(business_id);
    values.push(user_id);
    const setClause = setParts.join(', ');
    const updateQuery = 'UPDATE businesses SET ' + setClause + ' WHERE id = $' + idx + ' AND user_id = $' + (idx + 1) + ' RETURNING *';
    const result = await pool.query(updateQuery, values);
    return res.status(200).json({ message: 'Business updated successfully.', business: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.deleteBusiness = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const business_id = req.params.id;

    const check = await pool.query('SELECT * FROM businesses WHERE id = $1 AND user_id = $2', [business_id, user_id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Business not found.' });
    }

    await pool.query('DELETE FROM businesses WHERE id = $1 AND user_id = $2', [business_id, user_id]);
    return res.status(200).json({ message: 'Business deleted successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


