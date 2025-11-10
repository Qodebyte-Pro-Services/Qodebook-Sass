const pool = require('../config/db');
module.exports = {
 
  create: async (req, res) => {
    try {
    const {
      business_id,
      category_id,
      amount,
      period_start,
      period_end,
      budget_month,
      budget_year,
    } = req.body;

    if (!business_id || !category_id || !amount || !period_start || !period_end)
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields." });

   
    const prevBudget = await pool.query(
      `SELECT id, budget_remaining
       FROM budgets
       WHERE business_id = $1
         AND category_id = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [business_id, category_id]
    );

    const carryOver = prevBudget.rows.length
      ? Number(prevBudget.rows[0].budget_remaining)
      : 0;

    const totalAvailable = Number(amount) + carryOver;

    const result = await pool.query(
      `INSERT INTO budgets (
          business_id, category_id, amount, period_start, period_end,
          carry_over, budget_spent, budget_remaining,
          budget_month, budget_year, status
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pending')
        RETURNING *`,
      [
        business_id,
        category_id,
        amount,
        period_start,
        period_end,
        carryOver,
        0,
        totalAvailable,
        budget_month,
        budget_year,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Budget created successfully.",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("Create Budget Error:", err);
    res.status(500).json({ success: false, message: "Failed to create budget.", err });
  }
  },

  budgetAllCat: async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      business_id,
      default_amount,
      period_start,
      period_end,
      budget_month,
      budget_year,
    } = req.body;

    if (!business_id || !period_start || !period_end || !budget_month || !budget_year) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields.",
      });
    }

    await client.query("BEGIN");

    
    const categoriesRes = await client.query(
      `SELECT id FROM expense_categories WHERE business_id = $1`,
      [business_id]
    );

    if (categoriesRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "No expense categories found for this business.",
      });
    }

    const budgetsCreated = [];

    for (const cat of categoriesRes.rows) {
      const category_id = cat.id;

     
      const prevBudget = await client.query(
        `SELECT budget_remaining
         FROM budgets
         WHERE business_id = $1 AND category_id = $2
         ORDER BY created_at DESC
         LIMIT 1`,
        [business_id, category_id]
      );

      const carryOver = prevBudget.rows.length
        ? Number(prevBudget.rows[0].budget_remaining)
        : 0;

      const amount = default_amount || 0;
      const totalAvailable = Number(amount) + carryOver;

      const insertRes = await client.query(
        `INSERT INTO budgets (
          business_id, category_id, amount, period_start, period_end,
          carry_over, budget_spent, budget_remaining,
          budget_month, budget_year, status
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pending')
        RETURNING *`,
        [
          business_id,
          category_id,
          amount,
          period_start,
          period_end,
          carryOver,
          0,
          totalAvailable,
          budget_month,
          budget_year,
        ]
      );

      budgetsCreated.push(insertRes.rows[0]);
    }

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "Budgets created successfully for all categories.",
      data: budgetsCreated,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Create Budgets for All Categories Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create budgets for all categories.",
      error,
    });
  } finally {
    client.release();
  }
},


  manage: async (req, res) => {
     try {
    const { id } = req.params;
    const { action, approverId, role, rejection_reason } = req.body;

    if (!action || !role)
      return res.status(400).json({
        success: false,
        message: "Action and role are required.",
      });

    if (!["approve", "reject"].includes(action))
      return res.status(400).json({
        success: false,
        message: "Action must be either 'approve' or 'reject'.",
      });

    const status = action === "approve" ? "approved" : "rejected";

    let approvedByUser = null;
    let approvedByStaff = null;

    if (role === "user") approvedByUser = approverId;
    else if (role === "staff") approvedByStaff = approverId;

    const query = `
      UPDATE budgets
      SET status = $1,
          rejection_reason = $2,
          approved_by_user = $3,
          approved_by_staff = $4,
          approved_by_role = $5
      WHERE id = $6
      RETURNING *;
    `;

    const values = [
      status,
      rejection_reason || null,
      approvedByUser,
      approvedByStaff,
      role,
      id,
    ];

    const result = await pool.query(query, values);

    if (result.rowCount === 0)
      return res
        .status(404)
        .json({ success: false, message: "Budget not found." });

    res.json({
      success: true,
      message: `Budget ${action}d successfully.`,
      data: result.rows[0],
    });
  } catch (err) {
    console.error("Manage Budget Error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to update budget status." });
  }
  },
  


 

  list: async (req, res) => {
    try {
    const { business_id, status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const params = [];
    const where = [];

    if (business_id) {
      params.push(business_id);
      where.push(`b.business_id = $${params.length}`);
    }

    if (status) {
      params.push(status);
      where.push(`b.status = $${params.length}`);
    }

    let baseQuery = `
      SELECT 
        b.id, b.amount, b.period_start, b.period_end, b.carry_over,
        b.budget_spent, b.budget_remaining, b.budget_month, b.budget_year,
        b.status, b.rejection_reason, b.created_at,
        biz.business_name AS business_name,
        cat.name AS category_name,
        COALESCE(u.first_name || ' ' || u.last_name, '—') AS approved_by_user_name,
        COALESCE(s.full_name, '—') AS approved_by_staff_name
      FROM budgets b
      JOIN businesses biz ON b.business_id = biz.id
      JOIN expense_categories cat ON b.category_id = cat.id
      LEFT JOIN users u ON b.approved_by_user = u.id
      LEFT JOIN staff s ON b.approved_by_staff = s.staff_id
    `;

    if (where.length) baseQuery += ` WHERE ${where.join(" AND ")}`;
    baseQuery += ` ORDER BY b.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(baseQuery, params);

    const countQuery = `SELECT COUNT(*) FROM budgets b ${
      where.length ? "WHERE " + where.join(" AND ") : ""
    }`;
    const countRes = await pool.query(countQuery, where.length ? params.slice(0, where.length) : []);
    const total = parseInt(countRes.rows[0].count, 10);

    res.json({
      success: true,
      current_page: Number(page),
      total_pages: Math.ceil(total / limit),
      total_records: total,
      data: result.rows,
    });
  } catch (err) {
    console.error("List Budgets Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch budgets." });
  }
  },

  getOne: async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        b.id, b.amount, b.period_start, b.period_end, b.carry_over,
        b.budget_spent, b.budget_remaining, b.budget_month, b.budget_year,
        b.status, b.rejection_reason, b.created_at,
        biz.business_name AS business_name,
        cat.name AS category_name,
        COALESCE(u.first_name || ' ' || u.last_name, '—') AS approved_by_user_name,
        COALESCE(s.full_name, '—') AS approved_by_staff_name
      FROM budgets b
      JOIN businesses biz ON b.business_id = biz.id
      JOIN expense_categories cat ON b.category_id = cat.id
      LEFT JOIN users u ON b.approved_by_user = u.id
      LEFT JOIN staff s ON b.approved_by_staff = s.staff_id
      WHERE b.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0)
      return res.status(404).json({ success: false, message: "Budget not found." });

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    console.error("Get Budget Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch budget." });
  }
},

  transfer: async (req, res) => {
  const client = await pool.connect();
  try {
    const { business_id, from_category_id, to_category_id, amount, reason } = req.body;

    if (!business_id || !from_category_id || !to_category_id || !amount) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: business_id, from_category_id, to_category_id, amount",
      });
    }

    if (Number(from_category_id) === Number(to_category_id)) {
      return res.status(400).json({
        success: false,
        message: "Cannot transfer budget to the same category.",
      });
    }

    await client.query("BEGIN");

    
    const fromBudgetRes = await client.query(
      `SELECT * FROM budgets
       WHERE business_id = $1 AND category_id = $2
       ORDER BY created_at DESC LIMIT 1`,
      [business_id, from_category_id]
    );
    if (fromBudgetRes.rows.length === 0)
      throw new Error("Source category budget not found.");

    const fromBudget = fromBudgetRes.rows[0];

    if (Number(fromBudget.budget_remaining) < Number(amount))
      throw new Error("Insufficient remaining budget in source category.");

    
    const toBudgetRes = await client.query(
      `SELECT * FROM budgets
       WHERE business_id = $1 AND category_id = $2
       ORDER BY created_at DESC LIMIT 1`,
      [business_id, to_category_id]
    );
    if (toBudgetRes.rows.length === 0)
      throw new Error("Destination category budget not found.");

    const toBudget = toBudgetRes.rows[0];

   
    await client.query(
      `UPDATE budgets
       SET budget_remaining = budget_remaining - $1
       WHERE id = $2`,
      [amount, fromBudget.id]
    );

    await client.query(
      `UPDATE budgets
       SET budget_remaining = budget_remaining + $1
       WHERE id = $2`,
      [amount, toBudget.id]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      message: `Transferred ${amount} from category ${from_category_id} to ${to_category_id}.`,
      transfer_details: {
        from_category_id,
        to_category_id,
        amount,
        reason: reason || "Budget reallocation",
      },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Transfer Budget Error:", err);
    res.status(500).json({ success: false, message: err.message || "Budget transfer failed." });
  } finally {
    client.release();
  }
},


  update: async (req, res) => {
  try {
    const { id } = req.params;
    const {
      category_id,
      amount,
      period_start,
      period_end,
      budget_month,
      budget_year,
    } = req.body;

  
    if (!category_id || !amount || !period_start || !period_end) {
      return res.status(400).json({
        success: false,
        message: "All required fields (category_id, amount, period_start, period_end) must be provided.",
      });
    }

   
    const existingRes = await pool.query(
      `SELECT * FROM budgets WHERE id = $1`,
      [id]
    );

    if (existingRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Budget not found.",
      });
    }

    const existing = existingRes.rows[0];

    
    const carryOver = existing.carry_over ? Number(existing.carry_over) : 0;

   
    const totalAvailable = Number(amount) + carryOver;

    
    const newRemaining = totalAvailable - Number(existing.budget_spent || 0);

    
    const updateRes = await pool.query(
      `UPDATE budgets 
       SET category_id = $1,
           amount = $2,
           period_start = $3,
           period_end = $4,
           budget_month = $5,
           budget_year = $6,
           carry_over = $7,
           budget_remaining = $8
       WHERE id = $9
       RETURNING *`,
      [
        category_id,
        amount,
        period_start,
        period_end,
        budget_month || existing.budget_month,
        budget_year || existing.budget_year,
        carryOver,
        newRemaining,
        id,
      ]
    );

    res.json({
      success: true,
      message: "Budget updated successfully.",
      data: updateRes.rows[0],
    });
  } catch (err) {
    console.error("Update Budget Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update budget.",
      error: err.message,
    });
  }
},



  delete: async (req, res) => {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM budgets WHERE id = $1', [id]);
      res.json({ message: 'Budget deleted' });
    } catch (err) {
      console.error('Delete budget error:', err);
      res.status(500).json({ message: 'Failed to delete budget.' });
    }
  },
};
