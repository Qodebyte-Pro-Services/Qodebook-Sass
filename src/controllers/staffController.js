
const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { 
  sendStaffPasswordEmail, 
  sendOwnerPasswordNotification,
  sendPasswordChangeNotification,
  sendPasswordChangeRequestNotification,
  sendOwnerOtpNotification,
  sendStaffOtpEmail
} = require('../services/emailService');
const { error } = require('console');
const { uploadFilesToCloudinary, uploadToCloudinary, deleteFileFromCloudinary, ComplexDeleteFileFromCloudinary } = require('../utils/uploadToCloudinary');
const { logStaffAction } = require('../utils/staffAction');


exports.listStaffActions = async (req, res) => {
  try {
    const { staff_id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (!staff_id) {
      return res.status(400).json({ message: 'staff_id is required.' });
    }


    const countResult = await pool.query(
      'SELECT COUNT(*) FROM staff_actions WHERE staff_id = $1',
      [staff_id]
    );
    const totalItems = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalItems / limit);


    const result = await pool.query(
      `SELECT * FROM staff_actions 
       WHERE staff_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [staff_id, limit, offset]
    );

    return res.status(200).json({
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
      },
      staff_actions: result.rows,
    });
  } catch (err) {
    console.error('Error listing staff actions:', err);
    return res.status(500).json({ message: 'Server error while listing staff actions.' });
  }
};

exports.deleteStaffAction = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM staff_actions WHERE id = $1', [id]);
    return res.status(200).json({ message: `Staff action with ID ${id} deleted.` });
  } catch (err) {
    console.error('Error deleting staff action:', err);
    return res.status(500).json({ message: 'Server error while deleting staff action.' });
  }
};


exports.createStaffDoc = async (req, res) => {
  const client = await pool.connect();

  try {
    const { business_id, staff_id } = req.body;
    if (!business_id || !staff_id) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded." });
    }

    await client.query("BEGIN");

    const uploadedDocs = [];

  
    for (const file of req.files) {
      try {
        const uploaded = await uploadToCloudinary(file.buffer, file.originalname);
        uploadedDocs.push(uploaded);
      } catch (uploadErr) {
     
        for (const uploaded of uploadedDocs) {
          await ComplexDeleteFileFromCloudinary(uploaded.public_id);
        }
        throw uploadErr;
      }
    }

    const insertedDocs = [];

    for (const [index, doc] of uploadedDocs.entries()) {
      const id = uuidv4();
      const document_name =
        req.body.document_name?.[index] ||
        req.files[index]?.originalname ||
        `Document ${index + 1}`;

      const result = await client.query(
        `
        INSERT INTO staff_docs (id, business_id, staff_id, document_name, file)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `,
        [id, business_id, staff_id, document_name, doc.secure_url]
      );

      insertedDocs.push(result.rows[0]);
    }

    await client.query("COMMIT");
    await logStaffAction({
  business_id,
  staff_id,
  action_type: 'document_upload',
  action_value: `${insertedDocs.length} docs`,
  reason: 'New staff documents uploaded',
  performed_by: req.user?.fullname || 'admin',
  performed_by_role: req.user?.role || 'admin',
});
    return res.status(201).json({
      message: `${insertedDocs.length} document(s) uploaded successfully.`,
      staff_docs: insertedDocs,
    });
  } catch (err) {
    console.error("❌ Error uploading staff documents:", err);
    await client.query("ROLLBACK");
    return res
      .status(500)
      .json({ message: "Server error while uploading documents. All changes rolled back." });
  } finally {
    client.release();
  }
};


exports.listStaffDocs = async (req, res) => {
  try {
    const { business_id, staff_id, page = 1, limit = 20 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const values = [];
    let whereClause = '';

    if (business_id && staff_id) {
      whereClause = 'WHERE business_id = $1 AND staff_id = $2';
      values.push(business_id, staff_id);
    } else if (business_id) {
      whereClause = 'WHERE business_id = $1';
      values.push(business_id);
    } else if (staff_id) {
      whereClause = 'WHERE staff_id = $1';
      values.push(staff_id);
    }

    const countQuery = `SELECT COUNT(*) AS total FROM staff_docs ${whereClause}`;
    const { rows: countRows } = await pool.query(countQuery, values);
    const total = parseInt(countRows[0].total, 10);

    const query = `
      SELECT id, business_id, staff_id, document_name, file, created_at
      FROM staff_docs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2};
    `;

    const result = await pool.query(query, [...values, limit, offset]);

    return res.status(200).json({
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      staff_docs: result.rows,
    });
  } catch (err) {
    console.error('❌ Error fetching staff documents:', err);
    return res.status(500).json({ message: 'Server error while fetching staff documents.' });
  }
};

exports.updateStaffDoc = async (req, res) => {
  const client = await pool.connect();

  try {
    const { staff_id } = req.params;
    const { removed_docs } = req.body; 

    await client.query("BEGIN");

   
    if (removed_docs && Array.isArray(removed_docs) && removed_docs.length > 0) {
      const existingDocs = await client.query(
        `SELECT id, file FROM staff_docs WHERE id = ANY($1) AND staff_id = $2`,
        [removed_docs, staff_id]
      );

      for (const doc of existingDocs.rows) {
        await ComplexDeleteFileFromCloudinary(doc.file);
      }

      await client.query(`DELETE FROM staff_docs WHERE id = ANY($1) AND staff_id = $2`, [
        removed_docs,
        staff_id,
      ]);
    }

   
    const uploadedDocs = [];
    const insertedDocs = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const uploaded = await uploadToCloudinary(file.buffer, file.originalname);
          uploadedDocs.push(uploaded);
        } catch (uploadErr) {
          console.error("❌ Upload failed:", uploadErr);
          for (const uploaded of uploadedDocs) {
            await ComplexDeleteFileFromCloudinary(uploaded.public_id);
          }
          throw uploadErr;
        }
      }

      for (const [index, doc] of uploadedDocs.entries()) {
        const id = uuidv4();
        const document_name =
          req.body.document_name?.[index] ||
          req.files[index]?.originalname ||
          `Document ${index + 1}`;

        const result = await client.query(
          `
          INSERT INTO staff_docs (id, business_id, staff_id, document_name, file)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *;
        `,
          [id, req.body.business_id, staff_id, document_name, doc.secure_url]
        );

        insertedDocs.push(result.rows[0]);
      }
    }

    await client.query("COMMIT");

    
if ((removed_docs && removed_docs.length > 0) || insertedDocs.length > 0) {
  await logStaffAction({
    business_id: req.body.business_id,
    staff_id,
    action_type: 'document_upload',
    action_value: `${insertedDocs.length} added, ${removed_docs?.length || 0} removed`,
    reason: 'Staff documents updated',
    performed_by: req.user?.fullname || 'admin',
    performed_by_role: req.user?.role || 'admin',
  });
}


    return res.status(200).json({
      message: "Staff documents updated successfully.",
      added: insertedDocs,
      removed: removed_docs || [],
    });
  } catch (err) {
    console.error("❌ Error updating staff documents:", err);
    await client.query("ROLLBACK");
    return res.status(500).json({
      message: "Server error while updating staff documents. All changes rolled back.",
    });
  } finally {
    client.release();
  }
};

  exports.deleteStaffDoc = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Missing document ID." });

    await client.query("BEGIN");

   
    const { rows } = await client.query("SELECT * FROM staff_docs WHERE id = $1", [id]);
    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Document not found." });
    }

    const doc = rows[0];

    
    try {
      await ComplexDeleteFileFromCloudinary(doc.file);
    } catch (cloudErr) {
      console.error("⚠️ Cloudinary delete failed:", cloudErr.message);
     
      if (!/not found/i.test(cloudErr.message)) {
        await client.query("ROLLBACK");
        return res.status(500).json({
          message: "Failed to delete file from Cloudinary. Changes rolled back.",
        });
      }
    }

   
    await client.query("DELETE FROM staff_docs WHERE id = $1", [id]);

    await client.query("COMMIT");

    return res.status(200).json({
      message: "Staff document deleted successfully.",
      deleted_doc: {
        id: doc.id,
        document_name: doc.document_name,
        file_url: doc.file,
      },
    });
  } catch (err) {
    console.error("❌ Error deleting staff document:", err);
    await pool.query("ROLLBACK");
    return res.status(500).json({ message: "Server error while deleting document." });
  } finally {
    client.release();
  }
};



exports.createStaffShift = async (req, res) => {
  try {
    const {
      staff_id,
      business_id,
      fullname,
      working_hours,
      work_days
    } = req.body;


  
   
    if (!staff_id || !business_id || !fullname) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

   
    if (typeof working_hours !== 'object' || Array.isArray(working_hours)) {
      return res.status(400).json({ message: 'working_hours must be a valid JSON object.' });
    }

    if (!Array.isArray(work_days)) {
      return res.status(400).json({ message: 'work_days must be an array of days.' });
    }

    const shift_id = uuidv4();

    const query = `
      INSERT INTO staff_shifts 
      (shift_id, staff_id, business_id, fullname, working_hours, work_days)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [
      shift_id,
      staff_id,
      business_id,
      fullname,
      JSON.stringify(working_hours),
      JSON.stringify(work_days)
    ];

    const result = await pool.query(query, values);

   
    await logStaffAction({
      business_id,
      staff_id,
      action_type: 'shift_change',
      action_value: shift_id,
      reason: 'New shift assigned',
      performed_by: req.user?.fullname || 'admin',
      performed_by_role: req.user?.role || 'admin'
    });

    return res.status(201).json({
      message: 'Staff shift created successfully.',
      staff_shift: result.rows[0]
    });
  } catch (err) {
    console.error('Error creating staff shift:', err);
    return res.status(500).json({ message: 'Server error while creating staff shift.' });
  }
};
exports.listStaffShifts = async (req, res) => {
  try {
    const { staff_id } = req.params;

    if (!staff_id) {
      return res.status(400).json({ message: 'staff_id is required.' });
    }

    const result = await pool.query(
      'SELECT * FROM staff_shifts WHERE staff_id = $1',
      [staff_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No shifts found for this staff.' });
    }

    return res.status(200).json({ staff_shifts: result.rows });
  } catch (err) {
    console.error('Error fetching staff shifts:', err);
    return res.status(500).json({ message: 'Server error while fetching staff shifts.' });
  }
};
exports.updateStaffShift = async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;

    if (!id) return res.status(400).json({ message: 'Missing shift ID.' });

    const validFields = {};
    for (const key in fields) {
      if (['working_hours', 'work_days'].includes(key)) {
        validFields[key] = JSON.stringify(fields[key]);
      } else {
        validFields[key] = fields[key];
      }
    }

    const keys = Object.keys(validFields);
    if (keys.length === 0) {
      return res.status(400).json({ message: 'No fields to update.' });
    }

    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const values = Object.values(validFields);

    const query = `
      UPDATE staff_shifts
      SET ${setClause}
      WHERE shift_id = $${keys.length + 1}
      RETURNING *;
    `;
    const result = await pool.query(query, [...values, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Staff shift not found.' });
    }

    await logStaffAction({
      business_id: result.rows[0].business_id,
      staff_id: result.rows[0].staff_id,
      action_type: 'shift_change',
      action_value: result.rows[0].shift_id,
      reason: 'Shift updated',
      performed_by: req.user?.fullname || 'admin',
      performed_by_role: req.user?.role || 'admin'
    });

    return res.status(200).json({
      message: 'Staff shift updated successfully.',
      staff_shift: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating staff shift:', err);
    return res.status(500).json({ message: 'Server error while updating staff shift.' });
  }
};
exports.deleteStaffShift = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM staff_shifts WHERE shift_id = $1', [id]);
    return res.status(200).json({ message: 'Staff shift deleted.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.createStaffSubcharge = async (req, res) => {
  try {
    const { id, staff_id, sub_charge_amt, reason } = req.body;
    if (!id || !staff_id || !sub_charge_amt) return res.status(400).json({ message: 'Missing required fields.' });
    const result = await pool.query('INSERT INTO staff_subcharges (id, staff_id, sub_charge_amt, reason) VALUES ($1,$2,$3,$4) RETURNING *', [id, staff_id, sub_charge_amt, reason]);
    await logStaffAction({
  business_id: req.body.business_id,
  staff_id,
  action_type: 'subcharge',
  action_value: sub_charge_amt.toString(),
  reason,
  performed_by: req.user?.fullname || 'admin',
  performed_by_role: req.user?.role || 'admin',
});
    return res.status(201).json({ staff_subcharge: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
exports.listStaffSubcharges = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM staff_subcharges');
    return res.status(200).json({ staff_subcharges: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
exports.updateStaffSubcharge = async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    let setParts = [];
    let values = [];
    let idx = 1;
    for (const key in fields) {
      setParts.push(`${key} = $${idx}`);
      values.push(fields[key]);
      idx++;
    }
    if (setParts.length === 0) return res.status(400).json({ message: 'No fields to update.' });
    values.push(id);
    const setClause = setParts.join(', ');
    const query = `UPDATE staff_subcharges SET ${setClause} WHERE id = $${idx} RETURNING *`;
    const result = await pool.query(query, values);
    await logStaffAction({
  business_id: fields.business_id,
  staff_id: result.rows[0].staff_id,
  action_type: 'subcharge',
  action_value: result.rows[0].sub_charge_amt?.toString() || '',
  reason: fields.reason || 'Subcharge updated',
  performed_by: req.user?.fullname || 'admin',
  performed_by_role: req.user?.role || 'admin',
});
    return res.status(200).json({ staff_subcharge: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
exports.deleteStaffSubcharge = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM staff_subcharges WHERE id = $1', [id]);
    return res.status(200).json({ message: 'Staff subcharge deleted.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};




function generateStaffPassword(businessName) {
  const randomNumbers = Math.floor(Math.random() * 9000) + 1000; // 4-digit number
  const cleanBusinessName = businessName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return `${cleanBusinessName}${randomNumbers}`;
}


async function getBusinessStaffSettings(businessId, branchId = null) {
  let result;

  if (branchId) {

    result = await pool.query(
      `SELECT * 
       FROM business_staff_settings 
       WHERE business_id = $1 AND branch_id = $2 
       LIMIT 1`,
      [businessId, branchId]
    );

    
    if (result.rows.length === 0) {
      result = await pool.query(
        `SELECT * 
         FROM business_staff_settings 
         WHERE business_id = $1 AND branch_id IS NULL 
         LIMIT 1`,
        [businessId]
      );
    }
  } else {
  
    result = await pool.query(
      `SELECT * 
       FROM business_staff_settings 
       WHERE business_id = $1 AND branch_id IS NULL 
       LIMIT 1`,
      [businessId]
    );


    if (result.rows.length === 0) {
      result = await pool.query(
        `SELECT * 
         FROM business_staff_settings 
         WHERE business_id = $1 
         ORDER BY branch_id DESC 
         LIMIT 1`,
        [businessId]
      );
    }
  }

  return result.rows[0] || null;
}


async function sendPasswordToStaff(staffEmail, staffPhone, password, businessName, staffName = null, loginUrl) {
  try {
    if (staffEmail) {
      await sendStaffPasswordEmail(staffEmail, password, businessName, staffName, loginUrl);
      console.log(`Password email sent to staff: ${staffEmail}`);
    }

    if (staffPhone) {
      console.log(`Password SMS should be sent to: ${staffPhone}`);
    }
  } catch (error) {
    console.error('Error sending password email to staff:', error);
  }
}


async function sendPasswordToOwner(ownerEmail, staffName, password, businessName, loginUrl) {
  try {
    await sendOwnerPasswordNotification(ownerEmail, staffName, password, businessName, loginUrl);
    console.log(`Password email sent to owner: ${ownerEmail}`);
  } catch (error) {
    console.error('Error sending password email to owner:', error);
  }
}


  exports.createStaff = async (req, res) => {
  const client = await pool.connect();
  let uploadedFiles = [];

  try {
    const {
      business_id, branch_id, full_name, contact_no, email,
      address, position_name, assigned_position, gender,
      staff_status, date_of_birth, state_of_origin, emergency_contact,
      employment_type, start_date, salary, bank_account_number, bank_name,
      national_id, guarantor_name, guarantor_contact, guarantor_relationship,
      guarantor_address, payment_status, last_payment_date,
      staff_status_change_reason, baseUrl
    } = req.body;

    let staff_id = req.body.staff_id || uuidv4();

   
    const existingStaffById = await pool.query(
      `SELECT staff_id FROM staff WHERE staff_id = $1`,
      [staff_id]
    );
    if (existingStaffById.rows.length > 0) staff_id = uuidv4();


    if (
      !staff_id || !business_id || !branch_id || !full_name ||
      !contact_no || !email || !gender || !staff_status || !payment_status
    ) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    if (!baseUrl) {
      return res.status(400).json({ message: "Missing base URL." });
    }

    await client.query("BEGIN");


    const existingStaff = await client.query(
      `SELECT staff_id FROM staff WHERE email = $1 AND business_id = $2`,
      [email, business_id]
    );
    if (existingStaff.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "A staff member with this email already exists for this business." });
    }


    const businessResult = await client.query(
      "SELECT business_name FROM businesses WHERE id = $1",
      [business_id]
    );
    if (businessResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Business not found." });
    }

    const businessName = businessResult.rows[0].business_name;

    const password = generateStaffPassword(businessName);
    const passwordHash = await bcrypt.hash(password, 10);

    const settings = await getBusinessStaffSettings(business_id, branch_id);
    if (!settings) {
      await client.query("ROLLBACK");
      return res.status(500).json({ message: "Business staff settings not found." });
    }

 
    let photoUrl = null;
    let documentUrls = [];

    try {
      if (req.files?.photo?.[0]) {
        const uploadedPhoto = await uploadToCloudinary(
          req.files.photo[0].buffer,
          req.files.photo[0].originalname
        );
        photoUrl = uploadedPhoto.secure_url;
        uploadedFiles.push(uploadedPhoto);
      }

      if (req.files?.documents?.length > 0) {
        const uploadedDocs = await uploadFilesToCloudinary(req.files.documents);
        uploadedFiles.push(...uploadedDocs);
        documentUrls = uploadedDocs.map(doc => ({
          url: doc.secure_url,
          public_id: doc.public_id,
          type: doc.resource_type,
        }));
      }
    } catch (uploadErr) {
     
      for (const f of uploadedFiles) {
        try {
          await ComplexDeleteFileFromCloudinary(f.public_id);
        } catch (cleanupErr) {
          console.warn("⚠️ Cloudinary cleanup failed:", cleanupErr.message);
        }
      }
      throw uploadErr;
    }


    const result = await client.query(
      `
      INSERT INTO staff (
        staff_id, business_id, branch_id, full_name, contact_no, email,
        address, document, position_name, assigned_position, gender,
        staff_status, date_of_birth, state_of_origin, emergency_contact,
        employment_type, start_date, salary, bank_account_number, bank_name,
        national_id, guarantor_name, guarantor_contact, guarantor_relationship,
        guarantor_address, photo, payment_status, last_payment_date,
        staff_status_change_reason, password_hash, password_changed_at
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
        $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31
      )
      RETURNING *;
      `,
      [
        staff_id, business_id, branch_id, full_name, contact_no, email,
        address, JSON.stringify(documentUrls), position_name, assigned_position, gender,
        staff_status, date_of_birth, state_of_origin, emergency_contact,
        employment_type, start_date, salary, bank_account_number, bank_name,
        national_id, guarantor_name, guarantor_contact, guarantor_relationship,
        guarantor_address, photoUrl, payment_status, last_payment_date,
        staff_status_change_reason, passwordHash, new Date(),
      ]
    );

    const staff = result.rows[0];

 
    if (documentUrls.length > 0) {
      for (const doc of documentUrls) {
        await client.query(
          `
          INSERT INTO staff_docs (id, business_id, staff_id, document_name, file)
          VALUES ($1, $2, $3, $4, $5);
          `,
          [uuidv4(), business_id, staff_id, doc.url.split("/").pop(), doc.url]
        );
      }
    }

   
    const loginUrl = `${baseUrl.replace(/\/$/, "")}/staff/login/${business_id}`;
    if (settings.password_delivery_method === "staff") {
      await sendPasswordToStaff(email, contact_no, password, businessName, full_name, loginUrl);
    } else {
      const ownerResult = await client.query(
        "SELECT email FROM users WHERE business_id = $1 LIMIT 1",
        [business_id]
      );
      const ownerEmail = ownerResult.rows[0]?.email;
      if (ownerEmail) {
        await sendPasswordToOwner(ownerEmail, full_name, password, businessName, loginUrl);
      }
    }

   
    const requestedByUser = req.user?.user_id || null;
    const requestedByStaff = !req.user ? staff_id : null;
    await client.query(
      `
      INSERT INTO staff_password_logs (
        staff_id, business_id, change_type, requested_by_user, requested_by_staff, changed_at
      )
      VALUES ($1, $2, 'initial', $3, $4, NOW());
      `,
      [staff_id, business_id, requestedByUser, requestedByStaff]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      staff: { ...staff, password_hash: undefined },
      password: settings.password_delivery_method === "owner" ? password : undefined,
      message: `Staff created successfully. Password ${
        settings.password_delivery_method === "staff" ? "sent to staff" : "sent to owner"
      }.`,
    });
  } catch (err) {
    console.error("❌ Error creating staff:", err);
    await client.query("ROLLBACK");

   
    for (const f of uploadedFiles) {
      try {
        await ComplexDeleteFileFromCloudinary(f.public_id);
      } catch (cleanupErr) {
        console.warn("⚠️ Cleanup failed for Cloudinary file:", cleanupErr.message);
      }
    }

    return res.status(500).json({ message: "Server error. All changes rolled back." });
  } finally {
    client.release();
  }
};




exports.staffLogin = async (req, res) => {
  try {
    const { email, password, business_id } = req.body;

    if (!email || !password || !business_id) {
      return res.status(400).json({ message: 'Email, password, and business_id are required.' });
    }

 
    const staffResult = await pool.query(`
      SELECT s.*, r.permissions 
      FROM staff s 
      LEFT JOIN staff_roles r ON s.assigned_position = r.role_id 
      WHERE s.email = $1 AND s.business_id = $2 AND s.staff_status = 'on_job'
    `, [email, business_id]);

    if (staffResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials or inactive staff.' });
    }

    const staff = staffResult.rows[0];

   
    const isValidPassword = await bcrypt.compare(password, staff.password_hash);
    if (!isValidPassword) {
      await pool.query(`
        INSERT INTO staff_login_logs (staff_id, business_id, success, failure_reason, ip_address, user_agent)
        VALUES ($1, $2, false, 'Invalid password', $3, $4)
      `, [staff.staff_id, business_id, req.ip, req.get('User-Agent')]);

      return res.status(401).json({ message: 'Invalid credentials.' });
    }


    const settings = await getBusinessStaffSettings(business_id, staff.branch_id);

   
    if (settings?.require_otp_for_login) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); 

      await pool.query(`
        INSERT INTO staff_otps (staff_id, business_id, otp_code, purpose, expires_at)
        VALUES ($1, $2, $3, 'login', $4)
      `, [staff.staff_id, business_id, otp, expiresAt]);

    
      if (settings.otp_delivery_method === 'staff') {
        await sendStaffOtpEmail(staff.email, otp, staff.full_name);
      } else {
        const ownerResult = await pool.query(`SELECT owner_email, business_name FROM businesses WHERE id = $1`, [business_id]);
        if (ownerResult.rows.length > 0) {
          await sendOwnerOtpNotification(ownerResult.rows[0].owner_email, otp, ownerResult.rows[0].business_name);
        }
      }

      return res.status(200).json({
        message: `OTP sent via ${settings.otp_delivery_method}. Please verify to complete login.`,
        requiresOtp: true,
        staff_id: staff.staff_id,
        business_id,
      });
    }


    const token = jwt.sign({
      staff_id: staff.staff_id,
      business_id: staff.business_id,
      branch_id: staff.branch_id,
      email: staff.email,
      full_name: staff.full_name,
      role: staff.assigned_position,
      permissions: staff.permissions,
      isStaff: true
    }, process.env.JWT_SECRET, { expiresIn: `${settings?.session_timeout_minutes || 480}m` });

    const sessionId = crypto.randomBytes(32).toString('hex');
    await pool.query(`
      INSERT INTO staff_login_logs (staff_id, business_id, success, ip_address, user_agent, session_id)
      VALUES ($1, $2, true, $3, $4, $5)
    `, [staff.staff_id, business_id, req.ip, req.get('User-Agent'), sessionId]);

    return res.status(200).json({
      message: 'Login successful',
      requiresOtp: false,
      token,
      staff: {
        staff_id: staff.staff_id,
        full_name: staff.full_name,
        email: staff.email,
        role: staff.assigned_position,
        permissions: staff.permissions,
        business_id: staff.business_id,
        branch_id: staff.branch_id
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.verifyStaffOtp = async (req, res) => {
  try {
    const { staff_id, business_id, otp, purpose } = req.body;
    if (!staff_id || !business_id || !otp || !purpose)
      return res.status(400).json({ message: 'All fields are required.' });

    const otpResult = await pool.query(
      `SELECT * FROM staff_otps 
       WHERE staff_id = $1 AND business_id = $2 
       AND otp_code = $3 AND purpose = $4 
       AND used = FALSE AND expires_at > NOW()`,
      [staff_id, business_id, otp, purpose]
    );

    if (otpResult.rows.length === 0)
      return res.status(400).json({ message: 'Invalid or expired OTP.' });

    await pool.query(`UPDATE staff_otps SET used = TRUE WHERE id = $1`, [otpResult.rows[0].id]);

  
    const staffResult = await pool.query(
      `SELECT s.*, r.permissions 
       FROM staff s 
       LEFT JOIN staff_roles r ON s.assigned_position = r.role_id 
       WHERE s.staff_id = $1`, [staff_id]
    );

    const staff = staffResult.rows[0];
    const settings = await getBusinessStaffSettings(business_id, staff.branch_id);

    const token = jwt.sign({
      staff_id: staff.staff_id,
      business_id: staff.business_id,
      branch_id: staff.branch_id,
      email: staff.email,
      full_name: staff.full_name,
      role: staff.assigned_position,
      permissions: staff.permissions,
      isStaff: true
    }, process.env.JWT_SECRET, { expiresIn: `${settings?.session_timeout_minutes || 480}m` });

    return res.status(200).json({
      message: 'OTP verified. Login successful.',
      token,
      staff: {
        staff_id: staff.staff_id,
        full_name: staff.full_name,
        email: staff.email,
        role: staff.assigned_position,
        permissions: staff.permissions,
        business_id: staff.business_id,
        branch_id: staff.branch_id
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.resendStaffOtp = async (req, res) => {
  try {
    const { staff_id, business_id, purpose = 'login' } = req.body;

    if (!staff_id || !business_id) {
      return res.status(400).json({ message: 'staff_id and business_id are required.' });
    }

    
    const staffResult = await pool.query(`
      SELECT s.*, b.business_name 
      FROM staff s 
      JOIN businesses b ON s.business_id = b.id
      WHERE s.staff_id = $1 AND s.business_id = $2 AND s.staff_status = 'on_job'
    `, [staff_id, business_id]);

    if (staffResult.rows.length === 0) {
      return res.status(404).json({ message: 'Staff not found or inactive.' });
    }

    const staff = staffResult.rows[0];

   
    const settings = await getBusinessStaffSettings(business_id, staff.branch_id);
    if (!settings?.require_otp_for_login) {
      return res.status(400).json({ message: 'OTP login is not required for this business.' });
    }

   
    await pool.query(`
      UPDATE staff_otps SET used = TRUE 
      WHERE staff_id = $1 AND business_id = $2 AND purpose = $3 AND used = FALSE
    `, [staff_id, business_id, purpose]);

   
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); 

    await pool.query(`
      INSERT INTO staff_otps (staff_id, business_id, otp_code, purpose, expires_at)
      VALUES ($1, $2, $3, $4, $5)
    `, [staff_id, business_id, otp, purpose, expiresAt]);

    
    if (settings.otp_delivery_method === 'staff') {
      await sendStaffOtpEmail(staff.email, otp, staff.full_name);
    } else {
      const ownerResult = await pool.query(`
        SELECT owner_email, business_name 
        FROM businesses WHERE id = $1
      `, [business_id]);
      if (ownerResult.rows.length > 0) {
        await sendOwnerOtpNotification(ownerResult.rows[0].owner_email, otp, ownerResult.rows[0].business_name);
      }
    }

    return res.status(200).json({
      message: `A new OTP has been sent via ${settings.otp_delivery_method}.`,
      success: true
    });

  } catch (err) {
    console.error('Error resending OTP:', err);
    return res.status(500).json({ message: 'Server error while resending OTP.' });
  }
};





exports.requestPasswordChange = async (req, res) => {
  try {
    const { staff_id, new_password, current_password } = req.body;
    const { business_id } = req.user;


    const staffResult = await pool.query('SELECT password_hash, full_name, email FROM staff WHERE staff_id = $1 AND business_id = $2', [staff_id, business_id]);
    if (staffResult.rows.length === 0) {
      return res.status(404).json({ message: 'Staff not found.' });
    }

    const staff = staffResult.rows[0];
    const isValidPassword = await bcrypt.compare(current_password, staff.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

   
    const settings = await getBusinessStaffSettings(business_id);
    
    if (settings.password_change_policy === 'request') {
     
      await pool.query(`
        INSERT INTO staff_password_requests (staff_id, business_id, new_password_hash, requested_at, status)
        VALUES ($1, $2, $3, NOW(), 'pending')
      `, [staff_id, business_id, await bcrypt.hash(new_password, 10)]);

    
      try {
        const businessResult = await pool.query('SELECT business_name FROM businesses WHERE id = $1', [business_id]);
        const businessName = businessResult.rows[0]?.business_name || 'Your Business';

        const ownerResult = await pool.query('SELECT email FROM users WHERE business_id = $1 LIMIT 1', [business_id]);
        const ownerEmail = ownerResult.rows[0]?.email;
        
        if (ownerEmail) {
          await sendPasswordChangeRequestNotification(ownerEmail, staff.full_name, businessName);
        }
      } catch (emailError) {
        console.error('Error sending password change request notification:', emailError);
      }

      return res.status(200).json({ message: 'Password change request submitted for approval.' });
    } else {
     
      const newPasswordHash = await bcrypt.hash(new_password, 10);
      await pool.query(`
        UPDATE staff SET password_hash = $1, password_changed_at = NOW() 
        WHERE staff_id = $2 AND business_id = $3
      `, [newPasswordHash, staff_id, business_id]);

   
      try {
        const businessResult = await pool.query('SELECT business_name FROM businesses WHERE id = $1', [business_id]);
        const businessName = businessResult.rows[0]?.business_name || 'Your Business';

        await sendPasswordChangeNotification(staff.email, businessName, staff.full_name);
      } catch (emailError) {
        console.error('Error sending password change notification:', emailError);
      }


      const requestedByUser = req.user?.user_id || null;
      const requestedByStaff = staff_id_of_requester || null;
  
      await pool.query(`
        INSERT INTO staff_password_logs (staff_id, business_id, change_type, requested_by_user, requested_by_staff, changed_at, ip_address, user_agent)
        VALUES ($1, $2, 'change', $3, $4, NOW(), $5, $6)
      `, [staff_id, business_id, requestedByUser, requestedByStaff, req.ip, req.get('User-Agent')]);

      return res.status(200).json({ message: 'Password changed successfully.' });
    }

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.approvePasswordChangeRequest = async (req, res) => {
  try {
    const { request_id } = req.params;
    const { staff_id, new_password } = req.body;
    const { business_id } = req.user;


    const requestResult = await pool.query(`
      SELECT * FROM staff_password_requests WHERE id = $1 AND staff_id = $2 AND business_id = $3 AND status = 'pending'
    `, [request_id, staff_id, business_id]);

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ message: 'Password change request not found or not pending.' });
    }

    const request = requestResult.rows[0];


    const staffResult = await pool.query('SELECT full_name, email FROM staff WHERE staff_id = $1 AND business_id = $2', [staff_id, business_id]);
    if (staffResult.rows.length === 0) {
      return res.status(404).json({ message: 'Staff not found.' });
    }

    const staff = staffResult.rows[0];


    await pool.query(`
      UPDATE staff_password_requests SET approved_at = NOW(), approved_by = $1, status = 'approved' WHERE id = $2
    `, [req.user?.user_id || null, request_id]);


    const newPasswordHash = await bcrypt.hash(new_password, 10);
    await pool.query(`
      UPDATE staff SET password_hash = $1, password_changed_at = NOW() WHERE staff_id = $2 AND business_id = $3
    `, [newPasswordHash, staff_id, business_id]);

 
    try {
      const businessResult = await pool.query('SELECT business_name FROM businesses WHERE id = $1', [business_id]);
      const businessName = businessResult.rows[0]?.business_name || 'Your Business';

      await sendPasswordChangeNotification(staff.email, businessName, staff.full_name);
    } catch (emailError) {
      console.error('Error sending password change approval notification:', emailError);
    }


    const requestedByUser = req.user?.user_id || null;
      const requestedByStaff = staff_id_of_requester || null;
  
    await pool.query(`
      INSERT INTO staff_password_logs (staff_id, business_id, change_type, requested_by_user, requested_by_staff, changed_at, ip_address, user_agent)
      VALUES ($1, $2, 'change', $3, $4, NOW(), $5, $6)
    `, [staff_id, business_id, requestedByUser, requestedByStaff, req.ip, req.get('User-Agent')]);

    return res.status(200).json({ message: 'Password change request approved and password changed.' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.rejectPasswordChangeRequest = async (req, res) => {
  try {
    const { request_id } = req.params;
    const { rejection_reason } = req.body;
    const { business_id } = req.user;

   
    const requestResult = await pool.query(`
      SELECT * FROM staff_password_requests WHERE id = $1 AND status = 'pending'
    `, [request_id]);

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ message: 'Password change request not found or not pending.' });
    }

    const request = requestResult.rows[0];

   
    const staffResult = await pool.query('SELECT full_name, email FROM staff WHERE staff_id = $1 AND business_id = $2', [request.staff_id, business_id]);
    if (staffResult.rows.length > 0) {
      const staff = staffResult.rows[0];

     
      try {
        const businessResult = await pool.query('SELECT business_name FROM businesses WHERE id = $1', [business_id]);
        const businessName = businessResult.rows[0]?.business_name || 'Your Business';

        const subject = `Password Change Request Rejected - ${businessName}`;
        const message = `
          Hello ${staff.full_name},
          
          Your password change request for ${businessName} has been rejected.
          
          ${rejection_reason ? `Reason: ${rejection_reason}` : 'No reason provided.'}
          
          If you have any questions, please contact your administrator.
          
          Best regards,
          ${businessName} Team
        `;

        const htmlMessage = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Change Request Rejected</h2>
            <p>Hello ${staff.full_name},</p>
            
            <p>Your password change request for <strong>${businessName}</strong> has been rejected.</p>
            
            ${rejection_reason ? `<p><strong>Reason:</strong> ${rejection_reason}</p>` : '<p>No reason provided.</p>'}
            
            <p>If you have any questions, please contact your administrator.</p>
            
            <hr style="margin: 30px 0;">
            <p style="color: #666; font-size: 14px;">
              Best regards,<br>
              ${businessName} Team
            </p>
          </div>
        `;

        const { sendNotificationEmail } = require('../services/emailService');
        await sendNotificationEmail(staff.email, subject, message, htmlMessage);
      } catch (emailError) {
        console.error('Error sending password change rejection notification:', emailError);
      }
    }

   
    await pool.query(`
      UPDATE staff_password_requests SET approved_at = NOW(), approved_by = $1, status = 'rejected', rejection_reason = $2 WHERE id = $3
    `, [req.user?.user_id || null, rejection_reason, request_id]);

    return res.status(200).json({ message: 'Password change request rejected.' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.createBusinessStaffSettings = async (req, res) => {
  try {
    const { business_id } = req.params;
    const { 
      branch_id, password_delivery_method, password_change_policy, 
      require_otp_for_login, otp_delivery_method, session_timeout_minutes,
      max_login_attempts, lockout_duration_minutes 
    } = req.body;
    const existing = await pool.query('SELECT * FROM business_staff_settings WHERE business_id = $1 AND branch_id = $2', [business_id, branch_id]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Settings for this business and branch already exist. Use update endpoint.' });
    }
    const result = await pool.query(`
      INSERT INTO business_staff_settings (
        business_id, branch_id, password_delivery_method, password_change_policy,
        require_otp_for_login, otp_delivery_method, session_timeout_minutes,
        max_login_attempts, lockout_duration_minutes, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING *
    `, [
      business_id, branch_id, password_delivery_method, password_change_policy,
      require_otp_for_login, otp_delivery_method, session_timeout_minutes,
      max_login_attempts, lockout_duration_minutes
    ]);
    return res.status(201).json({ 
      message: 'Staff settings created successfully.',
      settings: result.rows[0] 
    });
  }
  catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
}


exports.getBusinessStaffSettings = async (req, res) => {
  try {
    const { business_id } = req.params;
    const { branch_id } = req.query;

    const settings = await getBusinessStaffSettings(business_id, branch_id);
    if (!settings) {
      return res.status(404).json({ message: 'Staff settings not found.' });
    }

    return res.status(200).json({ settings });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.updateBusinessStaffSettings = async (req, res) => {
  try {
    const { business_id } = req.params;
    const { 
      branch_id, password_delivery_method, password_change_policy, 
      require_otp_for_login, otp_delivery_method, session_timeout_minutes,
      max_login_attempts, lockout_duration_minutes 
    } = req.body;

    const result = await pool.query(`
      INSERT INTO business_staff_settings (
        business_id, branch_id, password_delivery_method, password_change_policy,
        require_otp_for_login, otp_delivery_method, session_timeout_minutes,
        max_login_attempts, lockout_duration_minutes, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      ON CONFLICT (business_id, branch_id) 
      DO UPDATE SET 
        password_delivery_method = EXCLUDED.password_delivery_method,
        password_change_policy = EXCLUDED.password_change_policy,
        require_otp_for_login = EXCLUDED.require_otp_for_login,
        otp_delivery_method = EXCLUDED.otp_delivery_method,
        session_timeout_minutes = EXCLUDED.session_timeout_minutes,
        max_login_attempts = EXCLUDED.max_login_attempts,
        lockout_duration_minutes = EXCLUDED.lockout_duration_minutes,
        updated_at = NOW()
      RETURNING *
    `, [
      business_id, branch_id, password_delivery_method, password_change_policy,
      require_otp_for_login, otp_delivery_method, session_timeout_minutes,
      max_login_attempts, lockout_duration_minutes
    ]);

    return res.status(200).json({ 
      message: 'Staff settings updated successfully.',
      settings: result.rows[0] 
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.getStaffLoginHistory = async (req, res) => {
  try {
    const { business_id } = req.params;
    const { staff_id, start_date, end_date, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT l.*, s.full_name, s.email 
      FROM staff_login_logs l 
      JOIN staff s ON l.staff_id = s.staff_id 
      WHERE l.business_id = $1
    `;
    let params = [business_id];
    let paramIndex = 2;

    if (staff_id) {
      query += ` AND l.staff_id = $${paramIndex}`;
      params.push(staff_id);
      paramIndex++;
    }

    if (start_date) {
      query += ` AND l.login_time >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` AND l.login_time <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    query += ` ORDER BY l.login_time DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    return res.status(200).json({ 
      login_history: result.rows,
      total: result.rows.length
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.listStaff = async (req, res) => {
  try {
    const { business_id, branch_id } = req.query;
    let query = 'SELECT * FROM staff';
    const params = [];
    const conditions = [];

    if (business_id) {
      params.push(business_id);
      conditions.push(`business_id = $${params.length}`);
    } else {
      return res.status(400).json({ message: 'business_id is required.' });
    }

    if (branch_id) {
      params.push(branch_id);
      conditions.push(`branch_id = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);

    return res.status(200).json({ staff: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.getStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM staff WHERE staff_id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Staff not found.' });
    return res.status(200).json({ staff: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    let setParts = [];
    let values = [];
    let idx = 1;
    for (const key in fields) {
      setParts.push(`${key} = $${idx}`);
      values.push(fields[key]);
      idx++;
    }
    if (setParts.length === 0) return res.status(400).json({ message: 'No fields to update.' });
    values.push(id);
    const setClause = setParts.join(', ');
    const query = `UPDATE staff SET ${setClause} WHERE staff_id = $${idx} RETURNING *`;
    const result = await pool.query(query, values);
    const updatedStaff = result.rows[0];

if ('staff_status' in fields) {
  await logStaffAction({
    business_id: updatedStaff.business_id,
    staff_id: updatedStaff.staff_id,
    action_type: 'status_change',
    action_value: fields.staff_status,
    reason: 'Staff status updated',
    performed_by: req.user?.fullname || 'admin',
    performed_by_role: req.user?.role || 'admin',
  });
}
    return res.status(200).json({ staff: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM staff WHERE staff_id = $1', [id]);
    return res.status(200).json({ message: 'Staff deleted.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.getStaffByBusiness = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM staff WHERE business_id = $1', [id]);
    return res.status(200).json({ staff: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.createRole = async (req, res) => {
  try {
    const { business_id, role_name, permissions, created_by } = req.body;
    if (!business_id || !role_name || !permissions || !created_by) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

   
    const permissionsJson = Array.isArray(permissions)
      ? JSON.stringify(permissions)
      : permissions;

    const role_id = uuidv4();

    const result = await pool.query(
      `INSERT INTO staff_roles (role_id, business_id, role_name, permissions, created_by) 
       VALUES ($1, $2, $3, $4::jsonb, $5) 
       RETURNING *`,
      [role_id, business_id, role_name, permissionsJson, created_by]
    );

    return res.status(201).json({ role: result.rows[0] });
  } catch (err) {
    console.error(err);

    if (err.code === '23505') {
      return res.status(409).json({
        message: `Role "${req.body.role_name}" already exists for this business.`,
      });
    }

    return res.status(500).json({ message: 'Server error.', error: err } );
  }
};

exports.listRoles = async (req, res) => {
  try {
    const { business_id } = req.query;
    if (!business_id) {
      return res.status(400).json({ message: 'business_id is required.' });
    }

    const result = await pool.query(
      'SELECT * FROM staff_roles WHERE business_id = $1',
      [business_id]
    );

    const roles = result.rows.map(r => ({
      ...r,
      permissions: typeof r.permissions === 'string'
        ? JSON.parse(r.permissions)
        : r.permissions
    }));

    return res.status(200).json({ roles });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.', error: err });
  }
};

exports.getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    const { business_id } = req.query;

    if (!business_id) {
      return res.status(400).json({ message: 'business_id is required.' });
    }

    const result = await pool.query(
      'SELECT * FROM staff_roles WHERE role_id = $1 AND business_id = $2',
      [id, business_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Role not found for this business.' });
    }

    const role = result.rows[0];
    role.permissions = typeof role.permissions === 'string'
      ? JSON.parse(role.permissions)
      : role.permissions;

    return res.status(200).json({ role });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.', error: err });
  }
};


exports.updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role_name, permissions } = req.body;

    let setParts = [];
    let values = [];
    let idx = 1;

    if (role_name) {
      setParts.push(`role_name = $${idx}`);
      values.push(role_name);
      idx++;
    }

    if (permissions) {
     
      const permissionsJson = Array.isArray(permissions)
        ? JSON.stringify(permissions)
        : permissions;
      setParts.push(`permissions = $${idx}::jsonb`);
      values.push(permissionsJson);
      idx++;
    }

    if (setParts.length === 0) {
      return res.status(400).json({ message: 'No fields to update.' });
    }

    values.push(id);
    const setClause = setParts.join(', ');
    const query = `UPDATE staff_roles SET ${setClause} WHERE role_id = $${idx} RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Role not found.' });
    }

    const updatedRole = result.rows[0];
    updatedRole.permissions = typeof updatedRole.permissions === 'string'
      ? JSON.parse(updatedRole.permissions)
      : updatedRole.permissions;

    return res.status(200).json({ role: updatedRole });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};



exports.deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM staff_roles WHERE role_id = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Role not found.' });
    }

    return res.status(200).json({ message: 'Role deleted successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

