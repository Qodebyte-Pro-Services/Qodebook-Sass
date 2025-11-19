const pool = require('../config/db');
const upload = require('../middlewares/upload');
const { io, userSockets } = require('../realtime');
const { logStaffAction } = require('../utils/staffAction');
// const uploadToFirebase = require('../utils/uploadToFireBase');
const uploadToCloudinary = require('../utils/uploadToCloudinary');


module.exports = {

  create: async (req, res) => {
    try {
     const { 
        business_id, 
        category_id, 
        staff_id, 
        amount, 
        description, 
        expense_date, 
        payment_method 
      } = req.body;


      if (!business_id || !category_id || !amount || !expense_date) {
        return res.status(400).json({ 
          success: false, 
          message: 'business_id, category_id, amount, and expense_date are required.' 
        });
      }

        let receipt_url = null;

      if (req.file) {
        const uploaded = await uploadToCloudinary(req.file.buffer, req.file.originalname);
        receipt_url = uploaded.secure_url;
      }

    
      const validMethods = [
        'cash', 'credit_card', 'debit_card', 'bank_transfer', 'mobile_payment', 'other'
      ];


       if (payment_method && !validMethods.includes(payment_method)) {
        return res.status(400).json({ 
          success: false, 
          message: `Invalid payment method. Must be one of: ${validMethods.join(', ')}` 
        });
      }

      const status = 'pending';
      const payment_status = 'pending';

       const query = `
        INSERT INTO expenses (
          business_id, 
          category_id, 
          staff_id, 
          amount, 
          description, 
          expense_date, 
          status, 
          receipt_url, 
          payment_method, 
          payment_status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *;
      `;

       const values = [
        business_id,
        category_id,
        staff_id || null,
        amount,
        description || null,
        expense_date,
        status,
        receipt_url,
        payment_method || null,
        payment_status
      ];

      const result = await pool.query(query, values);

      res.status(201).json({
        success: true,
        message: 'Expense created successfully.',
        expense: result.rows[0]
      });
   
    } catch (err) {
      console.error('Create expense error:', err);
      res.status(500).json({ message: 'Failed to create expense.', err });
    }
  },

list: async (req, res) => {
  try {
    const { business_id, status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let baseQuery = `
 SELECT 
    e.id,
    e.amount,
    e.description,
    e.expense_date,
    e.status,
    e.payment_method,
    e.payment_status,
    e.receipt_url,
    e.created_at,
    e.approved_at,
    e.status_updated_at,
    b.business_name AS business_name,
    COALESCE(c.name, '—') AS category_name,
    s.full_name AS staff_name,
    COALESCE(u.first_name || ' ' || u.last_name, '—') AS approved_by_user_name,
    sa.full_name AS approved_by_staff_name
FROM expenses e
JOIN businesses b ON e.business_id = b.id
LEFT JOIN expense_categories c ON e.category_id = c.id
LEFT JOIN staff s ON e.staff_id = s.staff_id
LEFT JOIN users u ON e.approved_by_user = u.id
LEFT JOIN staff sa ON e.approved_by_staff = sa.staff_id
    `;

    const params = [];
    const whereClauses = [];

    if (business_id) {
      params.push(business_id);
      whereClauses.push(`e.business_id = $${params.length}`);
    }

    if (status) {
      params.push(status);
      whereClauses.push(`e.status = $${params.length}`);
    }

    if (whereClauses.length > 0) {
      baseQuery += ` WHERE ${whereClauses.join(" AND ")}`;
    }

    baseQuery += ` ORDER BY e.expense_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(baseQuery, params);

    let countQuery = "SELECT COUNT(*) FROM expenses e";
    if (whereClauses.length > 0) {
      countQuery += ` WHERE ${whereClauses.join(" AND ")}`;
    }

    const countResult = await pool.query(countQuery, whereClauses.length ? params.slice(0, whereClauses.length) : []);
    const total = parseInt(countResult.rows[0].count, 10);

    res.json({
      success: true,
      current_page: Number(page),
      total_pages: Math.ceil(total / limit),
      total_records: total,
      data: result.rows,
    });
  } catch (err) {
    console.error("List expenses error:", err);
    res.status(500).json({ message: "Failed to list expenses.", err });
  }
},

  listSalaryForStaff: async (req, res) => {
    try {

        const { staff_id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;


      if (!staff_id) {
      return res.status(400).json({ success: false, message: "Staff ID is required." });
    }

   
    const staffCheck = await pool.query(
      "SELECT staff_name FROM staff WHERE staff_id = $1",
      [staff_id]
    );
    if (staffCheck.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Staff not found." });
    }

     const query = `
      SELECT 
        e.id,
        e.amount,
        e.description,
        e.payment_method,
        e.created_at AS payment_date,
        e.approved_by_role,
        e.approved_at,
        e.receipt_url
      FROM expenses e
      WHERE e.staff_id = $1
        AND e.expense_type = 'staff_salary'
      ORDER BY e.created_at DESC
      LIMIT $2 OFFSET $3
    `;


     const { rows } = await pool.query(query, [staff_id, limit, offset]);
     const countQuery = `
      SELECT COUNT(*) AS total
      FROM expenses
      WHERE staff_id = $1 AND expense_type = 'staff_salary'
    `;
    const totalResult = await pool.query(countQuery, [staff_id]);
    const total = parseInt(totalResult.rows[0].total, 10);

    return res.status(200).json({
      success: true,
      staff_name: staffCheck.rows[0].staff_name,
      current_page: Number(page),
      total_pages: Math.ceil(total / limit),
      total_records: total,
      data: rows,
    });
      
    } catch (err) {
    console.error("Error fetching staff salary history:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch staff salary history.",
      err
    });
    }
  },

  listExpense: async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid expense ID is required.",
      });
    }

    const query = `
      SELECT 
        e.id,
        e.amount,
        e.description,
        e.expense_date,
        e.status,
        e.payment_method,
        e.payment_status,
        e.receipt_url,
        e.created_at,
        e.approved_at,
        e.status_updated_at,
        b.id AS business_id,
        b.business_name AS business_name,
        b.business_phone AS business_phone,
        b.business_type AS business_type
        b.address AS business_address,
        c.id AS category_id,
        COALESCE(c.name, '—') AS category_name,
        s.staff_id,
        s.full_name AS staff_name,
        s.position_name AS staff_role,
        COALESCE(u.first_name || ' ' || u.last_name, '—') AS approved_by_user_name,
        sa.full_name AS approved_by_staff_name
      FROM expenses e
      JOIN businesses b ON e.business_id = b.id
      LEFT JOIN expense_categories c ON e.category_id = c.id
      LEFT JOIN staff s ON e.staff_id = s.staff_id
      LEFT JOIN users u ON e.approved_by_user = u.id
      LEFT JOIN staff sa ON e.approved_by_staff = sa.staff_id
      WHERE e.id = $1
      LIMIT 1;
    `;

    const result = await pool.query(query, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Expense not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Expense details retrieved successfully.",
      expense: result.rows[0],
    });
  } catch (err) {
    console.error("Get expense by ID error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch expense details.",
      error: err.message,
    });
  }
},

  updatePayment: async (req, res) => {
    try {
    const { id } = req.params; 
    const { payment_status } = req.body;

     const validStatuses = ['pending', 'completed', 'failed'];
    if (!validStatuses.includes(payment_status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid payment_status. Must be one of: ${validStatuses.join(', ')}`
      });
    }


    const user = req.user;
    const updaterId = user.isStaff ? user.staff_id : user.user_id;
    const updaterRole = user.isStaff ? 'staff' : 'user';

    const result = await pool.query(
      `
      UPDATE expenses
      SET 
        payment_status = $1,
        status_updated_by = $2,
        status_updated_by_role = $3,
        status_updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *;
      `,
      [payment_status, updaterId, updaterRole, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Expense not found.' });
    }

    res.status(200).json({
      success: true,
      message: `Expense payment status updated to "${payment_status}".`,
      expense: result.rows[0]
    });

    } catch (err) {
      console.error('❌ updatePaymentStatus error:', err);
    res.status(500).json({ success: false, message: 'Failed to update payment status.', err });
    }
  },

  expenseDecison: async (req, res) => {
    try {
       const { id } = req.params;
       const {status} = req.body;

         const validStatuses = ['in_review', 'approved', 'rejected', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const user = req.user;

    const approvedByRole = user.isStaff ? 'staff' : 'user';
    const approvedByUser = user.isStaff ? null : user.user_id;
    const approvedByStaff = user.isStaff ? user.staff_id : null;

    const result = await pool.query(
      `
      UPDATE expenses
      SET 
        status = $1,
        approved_by_role = $2,
        approved_by_user = $3,
        approved_by_staff = $4,
        approved_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *;
      `,
      [status, approvedByRole, approvedByUser, approvedByStaff, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Expense not found.' });
    }

      res.status(200).json({
      success: true,
      message: 'Expense approved successfully.',
      expense: result.rows[0]
    });
    } catch (err) {
       console.error(err);
  return res.status(500).json({
    success: false,
    message: "Internal server error.",
    error: err.message
  });
    }
  },

payStaffSalary: async (req, res) => {
  const client = await pool.connect();
  try {
    const { business_id, staff_id, payment_method, description, amountToBePaid } = req.body;
    const user = req.user;

    const updaterId = user.isStaff ? user.staff_id : user.user_id;
    const updaterRole = user.isStaff ? "staff" : "user";

    const approvedByRole = user.isStaff ? "staff" : "user";
    const approvedByUser = user.isStaff ? null : user.user_id;
    const approvedByStaff = user.isStaff ? user.staff_id : null;

    if (!business_id || !staff_id) {
      return res.status(400).json({
        success: false,
        message: "business_id and staff_id are required.",
      });
    }

    await client.query("BEGIN");

    
    const staffRes = await client.query(
      "SELECT * FROM staff WHERE staff_id = $1 AND business_id = $2",
      [staff_id, business_id]
    );

    if (staffRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ success: false, message: "Staff not found for this business." });
    }

    const staff = staffRes.rows[0];
    const amount = parseFloat(amountToBePaid);

    if (!amount || amount <= 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Invalid or missing staff salary amount.",
      });
    }

    
    const categoryRes = await client.query(
      `
      SELECT id FROM expense_categories
      WHERE business_id = $1
      AND LOWER(name) IN ('salary', 'salaries')
      LIMIT 1;
      `,
      [business_id]
    );

    let category_id;
    if (categoryRes.rowCount > 0) {
      category_id = categoryRes.rows[0].id;
    } else {
      const newCategory = await client.query(
        `
        INSERT INTO expense_categories (business_id, name, description)
        VALUES ($1, $2, $3)
        RETURNING id;
        `,
        [business_id, "Salary", "Staff salary payments"]
      );
      category_id = newCategory.rows[0].id;
    }

    
    let receipt_url = null;
    if (req.file) {
      const uploaded = await uploadToCloudinary(req.file.buffer, req.file.originalname);
      receipt_url = uploaded.secure_url;
    }

    const validMethods = [
      "cash",
      "credit_card",
      "debit_card",
      "bank_transfer",
      "mobile_payment",
      "other",
    ];

    if (payment_method && !validMethods.includes(payment_method)) {
      return res.status(400).json({
        success: false,
        message: `Invalid payment method. Must be one of: ${validMethods.join(", ")}`,
      });
    }

    
   const expenseInsert = await client.query(
  `
  INSERT INTO expenses (
    business_id,
    category_id,
    staff_id,
    amount,
    description,
    expense_date,
    status,
    approved_at,
    receipt_url,
    payment_method,
    payment_status,
    status_updated_by,
    status_updated_by_role,
    status_updated_at,
    approved_by_user,
    approved_by_staff,
    approved_by_role
  )
  VALUES (
    $1,  -- business_id
    $2,  -- category_id
    $3,  -- staff_id
    $4,  -- amount
    $5,  -- description
    CURRENT_DATE, -- expense_date
    'approved',   -- status
    CURRENT_TIMESTAMP, -- approved_at
    $6,  -- receipt_url
    $7,  -- payment_method
    'completed',  -- payment_status
    $8,  -- status_updated_by
    $9,  -- status_updated_by_role
    CURRENT_TIMESTAMP, -- status_updated_at
    $10, -- approved_by_user
    $11, -- approved_by_staff
    $12  -- approved_by_role
  )
  RETURNING *;
  `,
  [
    business_id,
    category_id,
    staff_id,
    amount,
    description || `Salary payment for ${staff.full_name}`,
    receipt_url,
    payment_method || null,
    updaterId,
    updaterRole,
    approvedByUser,
    approvedByStaff,
    approvedByRole
  ]
);

    const expense = expenseInsert.rows[0];

    
    await client.query(
      `
      UPDATE staff
      SET payment_status = 'paid', last_payment_date = CURRENT_DATE
      WHERE staff_id = $1;
      `,
      [staff_id]
    );

    await client.query(
  `DELETE FROM staff_subcharges
   WHERE staff_id = $1
   AND business_id = $2;`,
  [staff_id, business_id]
);


await logStaffAction({
  business_id,
  staff_id,
  action_type: "subcharge", 
  action_value: null,
  reason: "All subcharges cleared after salary payment",
  performed_by: user.isStaff ? user.staff_id : user.user_id,
  performed_by_role: user.isStaff ? "staff" : "user",
  client,
});

    
    await logStaffAction({
      business_id,
      staff_id,
      action_type: "staff_salary",
      action_value: expense.id.toString(),
      reason: "Salary payment processed",
      performed_by: user.isStaff ? user.staff_id : user.user_id,
      performed_by_role: user.isStaff ? "staff" : "user",
      client,
    });

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: `Salary of ₦${amount.toLocaleString()} paid to ${staff.full_name}`,
      expense,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("💥 payStaffSalary error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to process staff salary.",
      error: err.message,
    });
  } finally {
    client.release();
  }
},

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM expenses WHERE id = $1', [id]);
      res.json({ message: 'Expense deleted' });
    } catch (err) {
      console.error('Delete expense error:', err);
      res.status(500).json({ message: 'Failed to delete expense.' });
    }
  },
};
