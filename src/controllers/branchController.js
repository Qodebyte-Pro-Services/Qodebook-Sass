const pool = require('../config/db');


exports.createBranch = async (req, res) => {
  try {
    const { business_id, branch_name, location, branch_manager } = req.body;
    const business = await pool.query('SELECT * FROM businesses WHERE id = $1 AND user_id = $2', [business_id, req.user.user_id]);
    if (business.rows.length === 0) {
      return res.status(403).json({ message: 'Unauthorized or business not found.' });
    }
    const result = await pool.query(
      'INSERT INTO branches (business_id, branch_name, location, branch_manager) VALUES ($1, $2, $3, $4) RETURNING *',
      [business_id, branch_name, location, branch_manager]
    );
    return res.status(201).json({ message: 'Branch created successfully.', branch: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.listBranches = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT b.* FROM branches b JOIN businesses bs ON b.business_id = bs.id WHERE bs.user_id = $1',
      [req.user.user_id]
    );
    return res.status(200).json({ branches: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.getBranch = async (req, res) => {
  try {
    const branch_id = req.params.id;
    const result = await pool.query(
      'SELECT b.* FROM branches b JOIN businesses bs ON b.business_id = bs.id WHERE b.id = $1 AND bs.user_id = $2',
      [branch_id, req.user.user_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Branch not found.' });
    return res.status(200).json({ branch: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.updateBranch = async (req, res) => {
  try {
    const branch_id = req.params.id;
    const branchCheck = await pool.query(
      'SELECT b.* FROM branches b JOIN businesses bs ON b.business_id = bs.id WHERE b.id = $1 AND bs.user_id = $2',
      [branch_id, req.user.user_id]
    );
    if (branchCheck.rows.length === 0) return res.status(404).json({ message: 'Branch not found.' });
    const { branch_name, location, branch_manager } = req.body;
    let setParts = [];
    let values = [];
    let idx = 1;
    if (branch_name) { setParts.push('branch_name = $' + idx); values.push(branch_name); idx++; }
    if (location) { setParts.push('location = $' + idx); values.push(location); idx++; }
    if (branch_manager) { setParts.push('branch_manager = $' + idx); values.push(branch_manager); idx++; }
    if (setParts.length === 0) return res.status(400).json({ message: 'No fields to update.' });
    setParts.push('created_at = created_at'); 
    values.push(branch_id);
    const setClause = setParts.join(', ');
    const query = 'UPDATE branches SET ' + setClause + ' WHERE id = $' + idx + ' RETURNING *';
    const result = await pool.query(query, values);
    return res.status(200).json({ message: 'Branch updated.', branch: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.deleteBranch = async (req, res) => {
  try {
    const branch_id = req.params.id;
    const branchCheck = await pool.query(
      'SELECT b.* FROM branches b JOIN businesses bs ON b.business_id = bs.id WHERE b.id = $1 AND bs.user_id = $2',
      [branch_id, req.user.user_id]
    );
    if (branchCheck.rows.length === 0) return res.status(404).json({ message: 'Branch not found.' });
    await pool.query('DELETE FROM branches WHERE id = $1', [branch_id]);
    return res.status(200).json({ message: 'Branch deleted.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.listBranchesByBusiness = async (req, res) => {
  try {
    const business_id = req.params.businessId;
    const business = await pool.query('SELECT * FROM businesses WHERE id = $1 AND user_id = $2', [business_id, req.user.user_id]);
    if (business.rows.length === 0) return res.status(404).json({ message: 'Business not found.' });
    const result = await pool.query('SELECT * FROM branches WHERE business_id = $1', [business_id]);
    return res.status(200).json({ branches: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.getBranchByBusiness = async (req, res) => {
  try {
    const business_id = req.params.businessId;
    const branch_id = req.params.id;
    const business = await pool.query('SELECT * FROM businesses WHERE id = $1 AND user_id = $2', [business_id, req.user.user_id]);
    if (business.rows.length === 0) return res.status(404).json({ message: 'Business not found.' });
    const result = await pool.query('SELECT * FROM branches WHERE id = $1 AND business_id = $2', [branch_id, business_id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Branch not found.' });
    return res.status(200).json({ branch: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
