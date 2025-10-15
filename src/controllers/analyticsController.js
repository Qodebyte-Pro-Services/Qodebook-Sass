
const pool = require('../config/db');
const validator = require('validator');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');



exports.incomeExpenseOverTime = async (req, res) => {
  try {
    const { business_id, branch_id, period = 'day', start_date, end_date } = req.query;
    let params = [];
    let wheres = [];
    let idx = 1;
    if (business_id) { wheres.push(`o.business_id = $${idx}`); params.push(business_id); idx++; }
    if (branch_id) { wheres.push(`o.branch_id = $${idx}`); params.push(branch_id); idx++; }
    let whereClause = wheres.length > 0 ? 'WHERE ' + wheres.join(' AND ') : '';
    let dateSelect = `DATE_TRUNC('${period}', o.created_at)`;
    let dateWhere = '';
    if (start_date && end_date) dateWhere = ` AND o.created_at::date BETWEEN '${start_date}' AND '${end_date}'`;
    
    const incomeResult = await pool.query(
      `SELECT ${dateSelect} AS period, COALESCE(SUM(o.total_amount),0) AS total_income
       FROM orders o
       ${whereClause}${dateWhere}
       AND o.status = 'completed'
       GROUP BY period
       ORDER BY period ASC`,
      params
    );
   
    let expenseWheres = [];
    let expenseParams = [];
    let expenseIdx = 1;
    if (business_id) { expenseWheres.push(`e.business_id = $${expenseIdx}`); expenseParams.push(business_id); expenseIdx++; }
    if (branch_id) { expenseWheres.push(`e.branch_id = $${expenseIdx}`); expenseParams.push(branch_id); expenseIdx++; }
    let expenseWhereClause = expenseWheres.length > 0 ? 'WHERE ' + expenseWheres.join(' AND ') : '';
    let expenseDateSelect = `DATE_TRUNC('${period}', e.created_at)`;
    let expenseDateWhere = '';
    if (start_date && end_date) expenseDateWhere = ` AND e.created_at::date BETWEEN '${start_date}' AND '${end_date}'`;
    const expenseResult = await pool.query(
      `SELECT ${expenseDateSelect} AS period, COALESCE(SUM(e.amount),0) AS total_expense
       FROM expenses e
       ${expenseWhereClause}${expenseDateWhere}
       GROUP BY period
       ORDER BY period ASC`,
      expenseParams
    );
    res.json({ income: incomeResult.rows, expense: expenseResult.rows });
  } catch (err) {
    console.error('Income vs Expense over time error:', err);
    res.status(500).json({ message: 'Failed to fetch income vs expense over time.' });
  }
};


exports.grossNetProfitOverTime = async (req, res) => {
  try {
    const { business_id, branch_id, period = 'day', start_date, end_date } = req.query;
    let params = [];
    let wheres = [];
    let idx = 1;
    if (business_id) { wheres.push(`o.business_id = $${idx}`); params.push(business_id); idx++; }
    if (branch_id) { wheres.push(`o.branch_id = $${idx}`); params.push(branch_id); idx++; }
    let whereClause = wheres.length > 0 ? 'WHERE ' + wheres.join(' AND ') : '';
    let dateSelect = `DATE_TRUNC('${period}', o.created_at)`;
    let dateWhere = '';
    if (start_date && end_date) dateWhere = ` AND o.created_at::date BETWEEN '${start_date}' AND '${end_date}'`;
   
    const grossResult = await pool.query(
      `SELECT ${dateSelect} AS period, COALESCE(SUM(oi.quantity * oi.selling_price),0) AS total_sales, COALESCE(SUM(oi.quantity * oi.cost_price),0) AS total_cogs
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       ${whereClause}${dateWhere}
       AND o.status = 'completed'
       GROUP BY period
       ORDER BY period ASC`,
      params
    );
   
    let expenseWheres = [];
    let expenseParams = [];
    let expenseIdx = 1;
    if (business_id) { expenseWheres.push(`e.business_id = $${expenseIdx}`); expenseParams.push(business_id); expenseIdx++; }
    if (branch_id) { expenseWheres.push(`e.branch_id = $${expenseIdx}`); expenseParams.push(branch_id); expenseIdx++; }
    let expenseWhereClause = expenseWheres.length > 0 ? 'WHERE ' + expenseWheres.join(' AND ') : '';
    let expenseDateSelect = `DATE_TRUNC('${period}', e.created_at)`;
    let expenseDateWhere = '';
    if (start_date && end_date) expenseDateWhere = ` AND e.created_at::date BETWEEN '${start_date}' AND '${end_date}'`;
    const expenseResult = await pool.query(
      `SELECT ${expenseDateSelect} AS period, COALESCE(SUM(e.amount),0) AS total_expense
       FROM expenses e
       ${expenseWhereClause}${expenseDateWhere}
       GROUP BY period
       ORDER BY period ASC`,
      expenseParams
    );
  
    const profitMap = {};
    grossResult.rows.forEach(row => {
      profitMap[row.period] = {
        period: row.period,
        gross_profit: Number(row.total_sales) - Number(row.total_cogs),
        net_profit: Number(row.total_sales) - Number(row.total_cogs)
      };
    });
    expenseResult.rows.forEach(row => {
      if (!profitMap[row.period]) profitMap[row.period] = { period: row.period, gross_profit: 0, net_profit: 0 };
      profitMap[row.period].net_profit -= Number(row.total_expense);
    });
    res.json({ profit: Object.values(profitMap) });
  } catch (err) {
    console.error('Gross vs Net profit over time error:', err);
    res.status(500).json({ message: 'Failed to fetch gross vs net profit over time.' });
  }
};


exports.expenseOverTime = async (req, res) => {
  try {
    const { business_id, branch_id, period = 'day', start_date, end_date } = req.query;
    let params = [];
    let wheres = [];
    let idx = 1;
    if (business_id) { wheres.push(`e.business_id = $${idx}`); params.push(business_id); idx++; }
    if (branch_id) { wheres.push(`e.branch_id = $${idx}`); params.push(branch_id); idx++; }
    let whereClause = wheres.length > 0 ? 'WHERE ' + wheres.join(' AND ') : '';
    let dateSelect = `DATE_TRUNC('${period}', e.created_at)`;
    let dateWhere = '';
    if (start_date && end_date) dateWhere = ` AND e.created_at::date BETWEEN '${start_date}' AND '${end_date}'`;
    const expenseResult = await pool.query(
      `SELECT ${dateSelect} AS period, SUM(e.amount) AS total_expense
       FROM expenses e
       ${whereClause}${dateWhere}
       GROUP BY period
       ORDER BY period ASC`,
      params
    );
    res.json({ expense: expenseResult.rows });
  } catch (err) {
    console.error('Expense over time error:', err);
    res.status(500).json({ message: 'Failed to fetch expense over time.' });
  }
};


exports.budgetOverTime = async (req, res) => {
  try {
    const { business_id, branch_id, period = 'day', start_date, end_date } = req.query;
    let params = [];
    let wheres = [];
    let idx = 1;
    if (business_id) { wheres.push(`b.business_id = $${idx}`); params.push(business_id); idx++; }
    if (branch_id) { wheres.push(`b.branch_id = $${idx}`); params.push(branch_id); idx++; }
    let whereClause = wheres.length > 0 ? 'WHERE ' + wheres.join(' AND ') : '';
    let dateSelect = `DATE_TRUNC('${period}', b.created_at)`;
    let dateWhere = '';
    if (start_date && end_date) dateWhere = ` AND b.created_at::date BETWEEN '${start_date}' AND '${end_date}'`;
    const budgetResult = await pool.query(
      `SELECT ${dateSelect} AS period, SUM(b.amount) AS total_budget
       FROM budgets b
       ${whereClause}${dateWhere}
       GROUP BY period
       ORDER BY period ASC`,
      params
    );
    res.json({ budget: budgetResult.rows });
  } catch (err) {
    console.error('Budget over time error:', err);
    res.status(500).json({ message: 'Failed to fetch budget over time.' });
  }
};


exports.budgetAllocationByCategory = async (req, res) => {
  try {
    const { business_id, branch_id, period = 'day', start_date, end_date } = req.query;
    let params = [];
    let wheres = [];
    let idx = 1;
    if (business_id) { wheres.push(`b.business_id = $${idx}`); params.push(business_id); idx++; }
    if (branch_id) { wheres.push(`b.branch_id = $${idx}`); params.push(branch_id); idx++; }
    let whereClause = wheres.length > 0 ? 'WHERE ' + wheres.join(' AND ') : '';
    let dateSelect = `DATE_TRUNC('${period}', b.created_at)`;
    let dateWhere = '';
    if (start_date && end_date) dateWhere = ` AND b.created_at::date BETWEEN '${start_date}' AND '${end_date}'`;
    const allocationResult = await pool.query(
      `SELECT ec.name AS category, ${dateSelect} AS period, SUM(b.amount) AS total_budget
       FROM budgets b
       JOIN expense_categories ec ON b.category_id = ec.id
       ${whereClause}${dateWhere}
       GROUP BY ec.name, period
       ORDER BY period ASC, total_budget DESC`,
      params
    );
    res.json({ allocation: allocationResult.rows });
  } catch (err) {
    console.error('Budget allocation by category error:', err);
    res.status(500).json({ message: 'Failed to fetch budget allocation by category.' });
  }
};


exports.taxFlowOverTime = async (req, res) => {
  try {
    const { business_id, branch_id, period = 'day', start_date, end_date } = req.query;
    let params = [];
    let wheres = [];
    let idx = 1;
    if (business_id) { wheres.push(`o.business_id = $${idx}`); params.push(business_id); idx++; }
    if (branch_id) { wheres.push(`o.branch_id = $${idx}`); params.push(branch_id); idx++; }
    let whereClause = wheres.length > 0 ? 'WHERE ' + wheres.join(' AND ') : '';
    let dateSelect = `DATE_TRUNC('${period}', o.created_at)`;
    let dateWhere = '';
    if (start_date && end_date) dateWhere = ` AND o.created_at::date BETWEEN '${start_date}' AND '${end_date}'`;
    const taxResult = await pool.query(
      `SELECT ${dateSelect} AS period, SUM(o.tax) AS total_tax
       FROM orders o
       ${whereClause}${dateWhere}
       AND o.status = 'completed'
       GROUP BY period
       ORDER BY period ASC`,
      params
    );
    res.json({ tax: taxResult.rows });
  } catch (err) {
    console.error('Tax flow over time error:', err);
    res.status(500).json({ message: 'Failed to fetch tax flow over time.' });
  }
};

 function buildWhere({ business_id, branch_id }, alias = "") {
  const conditions = [];
  const params = [];

  if (business_id) {
    params.push(business_id);
    conditions.push(`${alias}business_id = $${params.length}`);
  }
  if (branch_id) {
    params.push(branch_id);
    conditions.push(`${alias}branch_id = $${params.length}`);
  }

  return {
    clause: conditions.length ? " AND " + conditions.join(" AND ") : "",
    params,
  };
}

function buildDateWhere(date_filter, start_date, end_date, alias = "o.") {
  switch (date_filter) {
    case "today":
      return ` AND ${alias}created_at::date = CURRENT_DATE`;
    case "yesterday":
      return ` AND ${alias}created_at::date = CURRENT_DATE - INTERVAL '1 day'`;
    case "this_week":
      return ` AND ${alias}created_at >= date_trunc('week', CURRENT_DATE)`;
    case "last_7_days":
      return ` AND ${alias}created_at >= CURRENT_DATE - INTERVAL '7 days'`;
    case "this_month":
      return ` AND ${alias}created_at >= date_trunc('month', CURRENT_DATE)`;
    case "this_year":
      return ` AND ${alias}created_at >= date_trunc('year', CURRENT_DATE)`;
    case "custom":
      if (start_date && end_date) {
        return ` AND ${alias}created_at::date BETWEEN '${start_date}' AND '${end_date}'`;
      }
      return "";
    default:
      return "";
  }
}


exports.overview = async (req, res) => {
  try {
    const business_id = req.query.business_id
      ? parseInt(req.query.business_id, 10)
      : req.business_id;

    const branch_id = req.query.branch_id
      ? parseInt(req.query.branch_id, 10)
      : req.branch_id;

    const date_filter = req.query.date_filter;
    const start_date = req.query.start_date;
    const end_date = req.query.end_date;

    
    const dateWhere = buildDateWhere(date_filter, start_date, end_date);

  
    const { clause: orderWhere, params: orderParams } = buildWhere(
      { business_id, branch_id },
      "o."
    );
    const salesByCategoryResult = await pool.query(
      `
      SELECT c.name AS category, SUM(oi.total_price) AS total_sales
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN variants v ON oi.variant_id = v.id
      JOIN products p ON v.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      WHERE o.status = 'completed'${orderWhere}${dateWhere}
      GROUP BY c.name
      ORDER BY total_sales DESC
      `,
      orderParams
    );

   
    const { clause: expenseWhere, params: expenseParams } = buildWhere(
      { business_id, branch_id },
      "e."
    );
    const expenseByCategoryResult = await pool.query(
      `
      SELECT ec.name AS category, SUM(e.amount) AS total_expense
      FROM expenses e
      JOIN expense_categories ec ON e.category_id = ec.id
      WHERE e.status = 'approved'${expenseWhere}
      GROUP BY ec.name
      ORDER BY total_expense DESC
      `,
      expenseParams
    );

   
    const { clause: budgetWhere, params: budgetParams } = buildWhere(
      { business_id, branch_id },
      "b."
    );
    const budgetByCategoryResult = await pool.query(
      `
      SELECT ec.name AS category, SUM(b.amount) AS total_budget
      FROM budgets b
      JOIN expense_categories ec ON b.category_id = ec.id
      WHERE TRUE${budgetWhere}
      GROUP BY ec.name
      ORDER BY total_budget DESC
      `,
      budgetParams
    );

    
    const grossIncomeResult = await pool.query(
      `
      SELECT SUM(total_amount) AS gross_income
      FROM orders o
      WHERE o.status = 'completed'${orderWhere}${dateWhere}
      `,
      orderParams
    );
    const grossIncome = Number(grossIncomeResult.rows[0]?.gross_income || 0);

   
    const { clause: productWhere, params: productParams } = buildWhere(
      { business_id, branch_id },
      "p."
    );
    const cogsResult = await pool.query(
      `
      SELECT COALESCE(SUM(v.cost_price * oi.quantity), 0) AS cogs
      FROM order_items oi
      JOIN variants v ON oi.variant_id = v.id
      JOIN products p ON v.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'completed'${productWhere}${dateWhere}
      `,
      productParams
    );
    const cogs = Number(cogsResult.rows[0]?.cogs || 0);


    const totalExpenseResult = await pool.query(
      `
      SELECT SUM(amount) AS total_expense
      FROM expenses e
      WHERE e.status = 'approved'${expenseWhere}
      `,
      expenseParams
    );
    const totalExpense = Number(totalExpenseResult.rows[0]?.total_expense || 0);

    const netIncome = grossIncome - cogs - totalExpense;


    const topProductsResult = await pool.query(
      `
      SELECT p.name, SUM(oi.quantity) AS units_sold, SUM(oi.total_price) AS total_sales
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN variants v ON oi.variant_id = v.id
      JOIN products p ON v.product_id = p.id
      WHERE o.status = 'completed'${orderWhere}${dateWhere}
      GROUP BY p.name
      ORDER BY total_sales DESC
      LIMIT 5
      `,
      orderParams
    );

   
const discountsResult = await pool.query(
  `
  SELECT COALESCE(SUM(d.amount), 0) + COALESCE(SUM(c.discount_amount), 0) AS total_discounts
  FROM discounts d
  FULL OUTER JOIN coupons c ON d.business_id = c.business_id::int
  ${business_id ? "WHERE d.business_id = $1 OR c.business_id::int = $1" : ""}
  `,
  business_id ? [business_id] : []
);
const discounts = Number(discountsResult.rows[0]?.total_discounts || 0);

const taxesResult = await pool.query(
  `
  SELECT COALESCE(SUM(rate), 0) AS total_tax_rate
  FROM taxes
  ${business_id ? "WHERE business_id::int = $1" : ""}
  `,
  business_id ? [business_id] : []
);
const taxes = Number(taxesResult.rows[0]?.total_tax_rate || 0);


    const staffSalaryExpenseResult = await pool.query(
      `
      SELECT COALESCE(SUM(e.amount), 0) AS total_staff_salary_paid
      FROM expenses e
      JOIN expense_categories ec ON e.category_id = ec.id
      WHERE e.status = 'approved' 
      AND (LOWER(ec.name) = 'salary' OR e.staff_id IS NOT NULL)${expenseWhere}
      `,
      expenseParams
    );
    const totalStaffSalaryPaid = Number(
      staffSalaryExpenseResult.rows[0]?.total_staff_salary_paid || 0
    );


  const counts = {};
const tables = ["products", "staff", "customers", "services"];
for (const table of tables) {
  const { clause, params } = buildWhere({ business_id, branch_id }, "");
  const result = await pool.query(
    `SELECT COUNT(*) FROM ${table} WHERE TRUE${clause}`,
    params
  );
  counts[table] = Number(result.rows[0]?.count || 0);
}



  
   const variantsCountResult = await pool.query(
  `
  SELECT COUNT(*)
  FROM variants v
  JOIN products p ON v.product_id = p.id
  WHERE TRUE${productWhere}
  `,
  productParams
);
    const variantsCount = Number(variantsCountResult.rows[0]?.count || 0);

  const variantsInStockResult = await pool.query(
  `
  SELECT COUNT(*)
  FROM variants v
  JOIN products p ON v.product_id = p.id
  WHERE v.quantity > 0${productWhere}
  `,
  productParams
);
    const variantsInStock = Number(variantsInStockResult.rows[0]?.count || 0);

    
    const today = new Date().toISOString().slice(0, 10);
    const staffWithShiftTodayResult = await pool.query(
      `
      SELECT COUNT(DISTINCT staff_id) AS count
      FROM staff_shifts s
      WHERE work_days LIKE $1
      `,
      [`%${today}%`]
    );
    const staffWithShiftToday = Number(
      staffWithShiftTodayResult.rows[0]?.count || 0
    );

  
    const stockMovementResult = await pool.query(
      `
      SELECT COUNT(*) as movement_count, COALESCE(SUM(quantity),0) as total_qty
      FROM inventory_logs
      `,
      []
    );

    const topStockMovementResult = await pool.query(
      `
      SELECT variant_id, SUM(quantity) as total_moved
      FROM inventory_logs
      GROUP BY variant_id
      ORDER BY total_moved DESC
      LIMIT 1
      `,
      []
    );

    
    const topExpenseCategoryResult = await pool.query(
      `
      SELECT ec.name, SUM(e.amount) as total_expense
      FROM expenses e
      JOIN expense_categories ec ON e.category_id = ec.id
      WHERE e.status = 'approved'${expenseWhere}
      GROUP BY ec.name
      ORDER BY total_expense DESC
      LIMIT 1
      `,
      expenseParams
    );

    
    const topBudgetCategoryResult = await pool.query(
      `
      SELECT ec.name, SUM(b.amount) as total_budget
      FROM budgets b
      JOIN expense_categories ec ON b.category_id = ec.id
      WHERE TRUE${budgetWhere}
      GROUP BY ec.name
      ORDER BY total_budget DESC
      LIMIT 1
      `,
      budgetParams
    );

   
 const { clause: serviceWhere, params: serviceParams } = buildWhere(
  { business_id, branch_id },
  "s." 
);

const serviceTrackingResult = await pool.query(
  `
  SELECT s.name, COUNT(a.id) as usage_count, COALESCE(SUM(s.price),0) as total_revenue
  FROM appointments a
  JOIN services s ON a.service_id = s.id
  WHERE TRUE${serviceWhere}
  GROUP BY s.name
  ORDER BY usage_count DESC
  `,
  serviceParams
);

    
    res.json({
      salesByCategory: salesByCategoryResult.rows,
      expenseByCategory: expenseByCategoryResult.rows,
      budgetByCategory: budgetByCategoryResult.rows,
      grossIncome,
      cogs,
      netIncome,
      topProducts: topProductsResult.rows,
      discounts,
      taxes,
      totalStaffSalaryPaid,
      productsCount: counts.products,
      variantsCount,
      variantsInStock,
      staffCount: counts.staff,
      customersCount: counts.customers,
      servicesCount: counts.services,
      staffWithShiftToday,
      stockMovement: stockMovementResult.rows[0],
      topStockMovement: topStockMovementResult.rows[0],
      topExpenseCategory: topExpenseCategoryResult.rows[0],
      topBudgetCategory: topBudgetCategoryResult.rows[0],
      serviceTracking: serviceTrackingResult.rows,
    });
  } catch (err) {
    console.error("Analytics overview error:", err);
    res.status(500).json({ message: "Failed to fetch analytics overview." });
  }
};

  exports.variationAnalytics = async (req, res) => {
  try {
    const { business_id, date_filter, start_date, end_date } = req.query;

    let params = [];
    let wheres = [];
    let idx = 1;

    // Always filter by business_id to prevent data spill
    if (business_id) {
      wheres.push(`p.business_id = $${idx}`);
      params.push(business_id);
      idx++;
    } else {
      return res.status(400).json({ message: 'Business ID is required' });
    }

    // Build date filter for inventory logs (using created_at for inventory changes)
    let dateWhere = '';
    if (date_filter) {
      if (date_filter === 'today') {
        dateWhere = ` AND il.created_at::date = CURRENT_DATE`;
      } else if (date_filter === 'yesterday') {
        dateWhere = ` AND il.created_at::date = CURRENT_DATE - INTERVAL '1 day'`;
      } else if (date_filter === 'this_week') {
        dateWhere = ` AND il.created_at >= date_trunc('week', CURRENT_DATE)`;
      } else if (date_filter === 'last_7_days') {
        dateWhere = ` AND il.created_at >= CURRENT_DATE - INTERVAL '7 days'`;
      } else if (date_filter === 'this_month') {
        dateWhere = ` AND il.created_at >= date_trunc('month', CURRENT_DATE)`;
      } else if (date_filter === 'this_year') {
        dateWhere = ` AND il.created_at >= date_trunc('year', CURRENT_DATE)`;
      } else if (date_filter === 'custom' && start_date && end_date) {
        dateWhere = ` AND il.created_at::date BETWEEN $${idx} AND $${idx + 1}`;
        params.push(start_date, end_date);
        idx += 2;
      }
    }

    const whereClause = wheres.length > 0 ? 'WHERE ' + wheres.join(' AND ') : '';

    // Get current inventory value and potential sale value
    const inventoryValueResult = await pool.query(
      `SELECT 
        COALESCE(SUM(v.cost_price * v.quantity), 0) AS inventory_value,
        COALESCE(SUM(v.selling_price * v.quantity), 0) AS potential_sale_value
       FROM variants v
       JOIN products p ON v.product_id = p.id
       ${whereClause}`,
      params
    );

    // Get COGS from inventory logs (more accurate than order_items)
    const cogsResult = await pool.query(
      `SELECT COALESCE(SUM(il.quantity * v.cost_price), 0) AS cogs
       FROM inventory_logs il
       JOIN variants v ON il.variant_id = v.id
       JOIN products p ON v.product_id = p.id
       WHERE il.type = 'sale' 
       AND p.business_id = $1
       ${dateWhere}`,
      [business_id]
    );

    res.json({
      inventory_value: Number(inventoryValueResult.rows[0]?.inventory_value || 0),
      potential_sale_value: Number(inventoryValueResult.rows[0]?.potential_sale_value || 0),
      cogs: Number(cogsResult.rows[0]?.cogs || 0)
    });

  } catch (err) {
    console.error('Variation analytics error:', err);
    res.status(500).json({ message: 'Failed to fetch variation analytics.' });
  }
};


exports.productAnalytics = async (req, res) => {
  try {
    const { business_id, date_filter, start_date, end_date } = req.query;
    let params = [];
    let wheres = [];
    let idx = 1;

    if (business_id) {
      wheres.push(`p.business_id = $${idx}`);
      params.push(business_id);
      idx++;
    }

    let dateWhere = '';
    if (date_filter) {
      if (date_filter === 'today') dateWhere = ` AND o.created_at::date = CURRENT_DATE`;
      else if (date_filter === 'yesterday') dateWhere = ` AND o.created_at::date = CURRENT_DATE - INTERVAL '1 day'`;
      else if (date_filter === 'this_week') dateWhere = ` AND o.created_at >= date_trunc('week', CURRENT_DATE)`;
      else if (date_filter === 'last_7_days') dateWhere = ` AND o.created_at >= CURRENT_DATE - INTERVAL '7 days'`;
      else if (date_filter === 'this_month') dateWhere = ` AND o.created_at >= date_trunc('month', CURRENT_DATE)`;
      else if (date_filter === 'this_year') dateWhere = ` AND o.created_at >= date_trunc('year', CURRENT_DATE)`;
      else if (date_filter === 'custom' && start_date && end_date)
        dateWhere = ` AND o.created_at::date BETWEEN '${start_date}' AND '${end_date}'`;
    }

    const topProductsResult = await pool.query(
      `
      SELECT p.id, p.name, SUM(oi.quantity) AS units_sold, SUM(oi.total_price) AS total_sales
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN variants v ON oi.variant_id = v.id
      JOIN products p ON v.product_id = p.id
      WHERE o.status = 'completed'
      ${wheres.length > 0 ? ' AND ' + wheres.join(' AND ') : ''}
      ${dateWhere}
      GROUP BY p.id, p.name
      ORDER BY total_sales DESC
      LIMIT 10
      `,
      params
    );

    res.json({ topProducts: topProductsResult.rows });
  } catch (err) {
    console.error('Product analytics error:', err);
    res.status(500).json({
      message: 'Failed to fetch product analytics.',
      error: err.message,
    });
  }
};



  exports.stockAnalytics = async (req, res) => {
  try {
    const { business_id, branch_id, date_filter, start_date, end_date } = req.query;

    if (!business_id) return res.status(400).json({ message: 'Business ID is required' });

    // If no date_filter -> current snapshot (fast, uses variants.quantity)
    if (!date_filter) {
      let params = [business_id];
      let wheres = ['p.business_id = $1'];
      let idx = 2;

      if (branch_id) {
        wheres.push(`p.branch_id = $${idx}`); params.push(branch_id); idx++;
      }

      let dateWhere = '';
      if (start_date && end_date) {
        dateWhere = ` AND v.updated_at::date BETWEEN $${idx} AND $${idx + 1}`;
        params.push(start_date, end_date);
        idx += 2;
      } else if (date_filter === 'today') dateWhere = ` AND v.updated_at::date = CURRENT_DATE`;
      else if (date_filter === 'yesterday') dateWhere = ` AND v.updated_at::date = CURRENT_DATE - INTERVAL '1 day'`;
      else if (date_filter === 'this_week') dateWhere = ` AND v.updated_at >= date_trunc('week', CURRENT_DATE)`;
      else if (date_filter === 'last_7_days') dateWhere = ` AND v.updated_at >= CURRENT_DATE - INTERVAL '7 days'`;
      else if (date_filter === 'this_month') dateWhere = ` AND v.updated_at >= date_trunc('month', CURRENT_DATE)`;
      else if (date_filter === 'this_year') dateWhere = ` AND v.updated_at >= date_trunc('year', CURRENT_DATE)`;

      const whereClause = 'WHERE ' + wheres.join(' AND ');

      const stockMetricsResult = await pool.query(
        `
        SELECT 
          COALESCE(SUM(v.quantity), 0) AS total_stock,
          COUNT(CASE WHEN v.quantity = 0 THEN 1 END) AS out_of_stock,
          COUNT(CASE WHEN v.quantity <= COALESCE(v.threshold, 0) AND v.quantity > 0 THEN 1 END) AS low_stock,
          COUNT(CASE WHEN v.quantity > 0 THEN 1 END) AS in_stock,
          COALESCE(SUM(v.cost_price * v.quantity), 0) AS inventory_value,
          COALESCE(SUM(v.selling_price * v.quantity), 0) AS potential_sale_value
        FROM variants v
        JOIN products p ON v.product_id = p.id
        ${whereClause} ${dateWhere}
        `,
        params
      );

      const row = stockMetricsResult.rows[0];
      return res.json({
        totalStock: Number(row?.total_stock || 0),
        outOfStock: Number(row?.out_of_stock || 0),
        lowStock: Number(row?.low_stock || 0),
        inStock: Number(row?.in_stock || 0),
        inventoryValue: Number(row?.inventory_value || 0),
        potentialSaleValue: Number(row?.potential_sale_value || 0)
      });
    }

    // Historical / point-in-time snapshot using inventory_logs
    // Determine as_of date (end of snapshot). For custom use end_date.
    let asOfDate = null;
    if (date_filter === 'custom') {
      if (!end_date) return res.status(400).json({ message: 'end_date is required for custom date_filter.' });
      asOfDate = end_date; // will be parameterized
    } else if (date_filter === 'yesterday') {
      asOfDate = "CURRENT_DATE - INTERVAL '1 day'";
    } else if (date_filter === 'today') {
      asOfDate = "CURRENT_DATE";
    } else {
      // default snapshot as of today for other named ranges (you can adapt)
      asOfDate = "CURRENT_DATE";
    }

    // Build params and product/branch where clause
    const params = [business_id];
    let idx = 2;
    let productWhere = `p.business_id = $1`;
    if (branch_id) {
      productWhere += ` AND p.branch_id = $${idx}`; params.push(branch_id); idx++;
    }

    // Build "as of end" comparison: we subtract any inventory_logs that occurred AFTER the end-of-asOfDate
    // Use a start-of-next-day expression so comparisons are timestamp-safe across timezones.
    let asOfStartExpr;
    if (date_filter === 'custom') {
      // param index holds end_date
      const asOfBind = idx;
      params.push(asOfDate);
      idx++;
      asOfStartExpr = `$${asOfBind}::date + INTERVAL '1 day'`; // movements >= this are AFTER the as-of date
    } else {
      // sql expression (e.g. CURRENT_DATE => start of next day is CURRENT_DATE + 1)
      if (date_filter === 'yesterday') {
        asOfStartExpr = `CURRENT_DATE`; // start of today => movements >= today are after yesterday
      } else if (date_filter === 'today') {
        asOfStartExpr = `CURRENT_DATE + INTERVAL '1 day'`; // start of tomorrow
      } else {
        asOfStartExpr = `CURRENT_DATE + INTERVAL '1 day'`;
      }
    }

    // net_after: net movements that happened AFTER the as-of date (>= asOfStartExpr)
    const query = `
      WITH net_after AS (
        SELECT
          v.id AS variant_id,
          COALESCE(SUM(
            CASE
              WHEN il.created_at >= ${asOfStartExpr} THEN
                CASE WHEN il.reason = 'increase' THEN il.quantity
                     WHEN il.reason = 'decrease' THEN -il.quantity
                     ELSE 0 END
              ELSE 0
            END
          ),0) AS net_after
        FROM variants v
        JOIN products p ON v.product_id = p.id
        LEFT JOIN inventory_logs il
          ON il.variant_id = v.id
          AND il.business_id = $1
          ${branch_id ? `AND il.branch_id = $2` : ''}
        WHERE ${productWhere}
        GROUP BY v.id
      )
      SELECT
        COALESCE(SUM(GREATEST(v.quantity - COALESCE(na.net_after,0), 0)), 0) AS total_stock,
        COUNT(*) FILTER (WHERE GREATEST(v.quantity - COALESCE(na.net_after,0),0) = 0) AS out_of_stock,
        COUNT(*) FILTER (WHERE GREATEST(v.quantity - COALESCE(na.net_after,0),0) <= COALESCE(v.threshold,0) AND GREATEST(v.quantity - COALESCE(na.net_after,0),0) > 0) AS low_stock,
        COUNT(*) FILTER (WHERE GREATEST(v.quantity - COALESCE(na.net_after,0),0) > 0) AS in_stock,
        COALESCE(SUM(v.cost_price * GREATEST(v.quantity - COALESCE(na.net_after,0),0)),0) AS inventory_value,
        COALESCE(SUM(v.selling_price * GREATEST(v.quantity - COALESCE(na.net_after,0),0)),0) AS potential_sale_value
      FROM variants v
      JOIN products p ON v.product_id = p.id
      LEFT JOIN net_after na ON na.variant_id = v.id
      WHERE ${productWhere}
    `;

    const finalParams = params;
    const metricsRes = await pool.query(query, finalParams);

    const row = metricsRes.rows[0] || {};
    return res.json({
      totalStock: Number(row.total_stock || 0),
      outOfStock: Number(row.out_of_stock || 0),
      lowStock: Number(row.low_stock || 0),
      inStock: Number(row.in_stock || 0),
      inventoryValue: Number(row.inventory_value || 0),
      potentialSaleValue: Number(row.potential_sale_value || 0),
      as_of: date_filter === 'custom' ? end_date : date_filter
    });
  } catch (err) {
    console.error('Stock analytics error:', err);
    res.status(500).json({ message: 'Failed to fetch stock analytics.' });
  }
};




  exports.salesAnalytics = async (req, res) => {
  try {
    const { business_id, branch_id, date_filter, start_date, end_date } = req.query;

    // ⛔ Mandatory enforcement
    if (!business_id) {
      return res.status(400).json({ message: "business_id is required" });
    }

    let params = [];
    let wheres = [];
    let idx = 1;

    // Always enforce business
    wheres.push(`o.business_id = $${idx}`);
    params.push(business_id);
    idx++;

    if (branch_id) {
      wheres.push(`o.branch_id = $${idx}`);
      params.push(branch_id);
      idx++;
    }

    // Common WHERE clause (base for all queries)
    let whereClause = `WHERE ${wheres.join(' AND ')} AND o.status = 'completed'`;

    // Dynamic date filter
    let dateWhere = '';
    if (date_filter) {
      if (date_filter === 'today') dateWhere = ` AND o.created_at::date = CURRENT_DATE`;
      else if (date_filter === 'yesterday') dateWhere = ` AND o.created_at::date = CURRENT_DATE - INTERVAL '1 day'`;
      else if (date_filter === 'this_week') dateWhere = ` AND o.created_at >= date_trunc('week', CURRENT_DATE)`;
      else if (date_filter === 'last_7_days') dateWhere = ` AND o.created_at >= CURRENT_DATE - INTERVAL '7 days'`;
      else if (date_filter === 'this_month') dateWhere = ` AND o.created_at >= date_trunc('month', CURRENT_DATE)`;
      else if (date_filter === 'this_year') dateWhere = ` AND o.created_at >= date_trunc('year', CURRENT_DATE)`;
      else if (date_filter === 'custom' && start_date && end_date)
        dateWhere = ` AND o.created_at::date BETWEEN '${start_date}' AND '${end_date}'`;
    }

    // 🧮 Total sales + orders
    const salesResult = await pool.query(
      `
      SELECT COUNT(*) AS total_orders,
             COALESCE(SUM(o.total_amount), 0) AS total_sales
      FROM orders o
      ${whereClause} ${dateWhere}
      `,
      params
    );

    // 💳 Payment method ratio
    const paymentMethodResult = await pool.query(
      `
      SELECT op.method,
             COUNT(*) AS count,
             COALESCE(SUM(op.amount), 0) AS total
      FROM order_payments op
      JOIN orders o ON op.order_id = o.id
      ${whereClause} ${dateWhere}
      GROUP BY op.method
      ORDER BY total DESC
      `,
      params
    );

    // 📦 Order type ratio
    const orderTypeResult = await pool.query(
      `
      SELECT o.order_type,
             COUNT(*) AS count,
             COALESCE(SUM(o.total_amount), 0) AS total
      FROM orders o
      ${whereClause} ${dateWhere}
      GROUP BY o.order_type
      ORDER BY total DESC
      `,
      params
    );

    // ✅ Response
    res.json({
      totalOrders: Number(salesResult.rows[0]?.total_orders || 0),
      totalSales: Number(salesResult.rows[0]?.total_sales || 0),
      paymentMethodRatio: paymentMethodResult.rows,
      orderTypeRatio: orderTypeResult.rows,
    });

  } catch (err) {
    console.error('Sales analytics error:', err);
    res.status(500).json({ message: 'Failed to fetch sales analytics.' });
  }
};


  exports.staffAnalytics = async (req, res) => {
    try {
      const { business_id, branch_id, date_filter, start_date, end_date } = req.query;
      let params = [];
      let wheres = [];
      let idx = 1;
      if (business_id) { wheres.push(`business_id = $${idx}`); params.push(business_id); idx++; }
      if (branch_id) { wheres.push(`branch_id = $${idx}`); params.push(branch_id); idx++; }
      let whereClause = wheres.length > 0 ? 'WHERE ' + wheres.join(' AND ') : '';
      let dateWhere = '';
      if (date_filter) {
        if (date_filter === 'today') dateWhere = ` AND created_at::date = CURRENT_DATE`;
        else if (date_filter === 'yesterday') dateWhere = ` AND created_at::date = CURRENT_DATE - INTERVAL '1 day'`;
        else if (date_filter === 'this_week') dateWhere = ` AND created_at >= date_trunc('week', CURRENT_DATE)`;
        else if (date_filter === 'last_7_days') dateWhere = ` AND created_at >= CURRENT_DATE - INTERVAL '7 days'`;
        else if (date_filter === 'this_month') dateWhere = ` AND created_at >= date_trunc('month', CURRENT_DATE)`;
        else if (date_filter === 'this_year') dateWhere = ` AND created_at >= date_trunc('year', CURRENT_DATE)`;
        else if (date_filter === 'custom' && start_date && end_date) dateWhere = ` AND created_at::date BETWEEN '${start_date}' AND '${end_date}'`;
      }
    
      const staffResult = await pool.query(
        `SELECT COUNT(*) AS total_staff FROM staff ${whereClause}${dateWhere}`,
        params
      );
      res.json({ totalStaff: Number(staffResult.rows[0]?.total_staff || 0) });
    } catch (err) {
      console.error('Staff analytics error:', err);
      res.status(500).json({ message: 'Failed to fetch staff analytics.' });
    }
  };


exports.stockMovementAnalytics = async (req, res) => {
  try {
    const { business_id, branch_id, variant_id, product_id, period, start_date, end_date } = req.query;

    const params = [];
    const wheres = [];
    let idx = 1;

    if (business_id) {
      wheres.push(`p.business_id = $${idx++}`);
      params.push(business_id);
    }

    if (branch_id) {
      wheres.push(`p.branch_id = $${idx++}`);
      params.push(branch_id);
    }

    if (variant_id) {
      wheres.push(`v.id = $${idx++}`);
      params.push(variant_id);
    }

    if (product_id) {
      wheres.push(`p.id = $${idx++}`);
      params.push(product_id);
    }

    if (start_date && end_date) {
      wheres.push(`il.created_at::date BETWEEN $${idx++} AND $${idx++}`);
      params.push(start_date, end_date);
    }

    const whereClause = wheres.length > 0 ? `WHERE ${wheres.join(' AND ')}` : '';

    let dateSelect = `DATE(il.created_at)`;
    let dateTrunc = `DATE(il.created_at)`;
    if (period === 'hour') {
      dateSelect = `DATE_TRUNC('hour', il.created_at)`;
      dateTrunc = `DATE_TRUNC('hour', il.created_at)`;
    } else if (period === 'week') {
      dateSelect = `DATE_TRUNC('week', il.created_at)`;
      dateTrunc = `DATE_TRUNC('week', il.created_at)`;
    } else if (period === 'month') {
      dateSelect = `DATE_TRUNC('month', il.created_at)`;
      dateTrunc = `DATE_TRUNC('month', il.created_at)`;
    } else if (period === 'year') {
      dateSelect = `DATE_TRUNC('year', il.created_at)`;
      dateTrunc = `DATE_TRUNC('year', il.created_at)`;
    }

    // Group only by period (not by reason). Return ordered movement list per period
    const query = `
      SELECT
        ${dateSelect} AS period,
        -- separate totals
        COALESCE(SUM(CASE WHEN il.reason = 'increase' THEN il.quantity ELSE 0 END),0) AS total_increased,
        COALESCE(SUM(CASE WHEN il.reason = 'decrease' THEN il.quantity ELSE 0 END),0) AS total_decreased,
        -- net movement (increase - decrease)
        COALESCE(SUM(CASE WHEN il.reason = 'decrease' THEN -ABS(il.quantity) ELSE ABS(il.quantity) END),0) AS net_moved,
        COUNT(*) AS movement_count,
        MIN(il.created_at) AS first_movement,
        MAX(il.created_at) AS last_movement,
        -- full chronological list for the period
        ARRAY_AGG(
          JSON_BUILD_OBJECT(
            'created_at', il.created_at,
            'reason', il.reason,
            'quantity', il.quantity,
            'note', il.note
          ) ORDER BY il.created_at
        ) AS movements
      FROM inventory_logs il
      JOIN variants v ON il.variant_id = v.id
      JOIN products p ON v.product_id = p.id
      ${whereClause}
      GROUP BY ${dateTrunc}
      ORDER BY MIN(il.created_at) ASC
    `;

    const movementResult = await pool.query(query, params);

    res.json({ movements: movementResult.rows });
  } catch (err) {
    console.error('Stock movement analytics error:', err);
    res.status(500).json({ message: 'Failed to fetch stock movement analytics.' });
  }
};



  exports.productVariantStockMovement = async (req, res) => {
  try {
    const { business_id, product_id, branch_id, period = 'day', start_date, end_date } = req.query;
    if (!business_id) {
      return res.status(400).json({ message: 'business_id is required' });
    }
    if (!product_id) {
      return res.status(400).json({ message: 'product_id is required' });
    }

    
    const variantsResult = await pool.query(
      `SELECT v.id, v.sku
       FROM variants v
       JOIN products p ON v.product_id = p.id
       WHERE v.product_id = $1 AND p.business_id = $2`,
      [product_id, business_id]
    );
    const variants = variantsResult.rows;
    if (variants.length === 0) {
      return res.json({ product_id, variants: [] });
    }

    
    let params = [product_id, business_id];
    let idx = 3;
    let dateSelect = `il.created_at`;
    if (period === 'hour') dateSelect = `DATE_TRUNC('hour', il.created_at)`;
    else if (period === 'day') dateSelect = `DATE(il.created_at)`;
    else if (period === 'week') dateSelect = `DATE_TRUNC('week', il.created_at)`;
    else if (period === 'month') dateSelect = `DATE_TRUNC('month', il.created_at)`;
    else if (period === 'year') dateSelect = `DATE_TRUNC('year', il.created_at)`;

    let branchWhere = '';
    if (branch_id) {
      branchWhere = ` AND il.branch_id = $${idx}`;
      params.push(branch_id);
      idx++;
    }
    let dateWhere = '';
    if (start_date && end_date) {
      dateWhere = ` AND il.created_at::date BETWEEN $${idx} AND $${idx + 1}`;
      params.push(start_date, end_date);
      idx += 2;
    }

    const movementResult = await pool.query(
      `SELECT il.variant_id, v.sku, ${dateSelect} AS period, il.quantity AS movement, il.reason
       FROM inventory_logs il
       JOIN variants v ON il.variant_id = v.id
       JOIN products p ON v.product_id = p.id
       WHERE v.product_id = $1 AND p.business_id = $2${branchWhere}${dateWhere}
       ORDER BY il.variant_id, period ASC`,
      params
    );

   
    const variantMap = {};
    variants.forEach(v => {
      variantMap[v.id] = { variant_id: v.id, sku: v.sku, flow: [] };
    });
    movementResult.rows.forEach(row => {
      if (variantMap[row.variant_id]) {
        variantMap[row.variant_id].flow.push({
          period: row.period,
          movement: row.movement,
          reason: row.reason
        });
      }
    });

    res.json({
      product_id,
      variants: Object.values(variantMap)
    });
  } catch (err) {
    console.error('Product variant stock movement error:', err);
    res.status(500).json({ message: 'Failed to fetch product variant stock movement.', error: err.message });
  }
};

  exports.salesMovementAnalytics = async (req, res) => {
    try {
      const { business_id, branch_id, variant_id, product_id, period, start_date, end_date } = req.query;
      let params = [];
      let wheres = [];
      let idx = 1;
      if (business_id) { wheres.push(`p.business_id = $${idx}`); params.push(business_id); idx++; }
      if (branch_id) { wheres.push(`p.branch_id = $${idx}`); params.push(branch_id); idx++; }
      if (variant_id) { wheres.push(`v.id = $${idx}`); params.push(variant_id); idx++; }
      if (product_id) { wheres.push(`p.id = $${idx}`); params.push(product_id); idx++; }
      let whereClause = wheres.length > 0 ? 'WHERE ' + wheres.join(' AND ') : '';
      let dateGroup = 'day';
      let dateSelect = `DATE(o.created_at)`;
      if (period === 'hour') { dateGroup = 'hour'; dateSelect = `DATE_TRUNC('hour', o.created_at)`; }
      else if (period === 'day') { dateGroup = 'day'; dateSelect = `DATE(o.created_at)`; }
      else if (period === 'week') { dateGroup = 'week'; dateSelect = `DATE_TRUNC('week', o.created_at)`; }
      else if (period === 'month') { dateGroup = 'month'; dateSelect = `DATE_TRUNC('month', o.created_at)`; }
      else if (period === 'year') { dateGroup = 'year'; dateSelect = `DATE_TRUNC('year', o.created_at)`; }
      let dateWhere = '';
      if (start_date && end_date) {
        dateWhere = ` AND o.created_at::date BETWEEN '${start_date}' AND '${end_date}'`;
      }
      
      const movementResult = await pool.query(
        `SELECT ${dateSelect} AS period, SUM(oi.quantity) AS total_sold, SUM(oi.total_price) AS total_sales, COUNT(*) AS sales_count, MIN(o.created_at) AS first_sale, MAX(o.created_at) AS last_sale
         FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         JOIN variants v ON oi.variant_id = v.id
         JOIN products p ON v.product_id = p.id
         WHERE o.status = 'completed'${whereClause ? ' AND ' + whereClause.replace('WHERE ', '') : ''}${dateWhere}
         GROUP BY period
         ORDER BY period ASC`,
        params
      );
      res.json({ movements: movementResult.rows });
    } catch (err) {
      console.error('Sales movement analytics error:', err);
      res.status(500).json({ message: 'Failed to fetch sales movement analytics.' });
    }
  };



const isBooleanString = v => ['true','false', true, false].includes(v);

const isValidDate = (s) => validator.isDate(String(s || ''), { format: 'YYYY-MM-DD', strictMode: true });

// Utility to compute days between dates
const daysBetween = (start, end) => {
  const a = new Date(start);
  const b = new Date(end);
  return Math.ceil((b - a) / (1000 * 60 * 60 * 24));
};


exports.salesReport = async (req, res) => {
  try {
    // read query
    const {
    business_id,
      branch_id,
      cashier,
      order_method,
      category_type,
      period = "day",
      start_date,
      end_date,
      summary = "true",
      details = "false",
      payment_methods = "false",
      product_breakdown = "false",
      page = "1",
      pageSize = "20",
      format = "json"    // json | pdf
    } = req.query;

    // Basic validations
       if (!business_id) return res.status(400).json({ error: "business_id is required" });
    if (!['day','month','year','custom'].includes(period)) return res.status(400).json({ error: "Invalid period parameter" });
    if (period === 'custom') {
      if (!start_date || !end_date) return res.status(400).json({ error: "start_date and end_date required for custom period" });
      if (!isValidDate(start_date) || !isValidDate(end_date)) return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
      if (new Date(start_date) > new Date(end_date)) return res.status(400).json({ error: "start_date must be <= end_date" });
    }
    if (![summary, details, payment_methods, product_breakdown].every(isBooleanString)) {
      return res.status(400).json({ error: "summary/details/payment_methods/product_breakdown must be true or false" });
    }
    if (!['json','pdf'].includes(String(format).toLowerCase())) return res.status(400).json({ error: "format must be json or pdf" });


      const pageInt = parseInt(page, 10);
    const pageSizeInt = parseInt(pageSize, 10);
    if (isNaN(pageInt) || isNaN(pageSizeInt) || pageInt < 1 || pageSizeInt < 1) {
      return res.status(400).json({ error: "Invalid pagination parameters" });
    }
    // If period large => async handling: year or custom > 30 days
    const isLargeReport = period === 'year' || (period === 'custom' && daysBetween(start_date, end_date) > 30);

    // Build WHERE clause with paramized placeholders
    const whereParts = ["o.status = 'completed'", "o.business_id = $1"];
    const params = [business_id];
    let idx = 2;

    if (branch_id) {
      whereParts.push(`o.branch_id = $${idx}`); params.push(branch_id); idx++;
    }

    // cashier filter: cashier may be staff_id OR created_by_user_id (the person who recorded sale)
    if (cashier) {
      whereParts.push(`(o.staff_id = $${idx} OR o.created_by_user_id = $${idx})`);
      params.push(cashier);
      idx++;
    }

    if (order_method) {
      // map to order_type column
      whereParts.push(`o.order_type = $${idx}`); params.push(order_method); idx++;
    }

    // category_type -> join conditions will be required later in queries that need it.
    const needCategoryJoin = Boolean(category_type);
    if (needCategoryJoin) {
      // We'll add category filter placeholder; actual JOIN included on specific queries
      whereParts.push(`LOWER(c.category_name) = $${idx}`); params.push(String(category_type).toLowerCase()); idx++;
    }

    // date filters
if (period === 'day') {
  if (start_date && end_date) {
    // Allow custom range for day, e.g., a specific date or 2-day span
    whereParts.push(`o.created_at::date BETWEEN $${idx} AND $${idx + 1}`);
    params.push(start_date, end_date);
    idx += 2;
  } else {
    // Default to today
    whereParts.push(`DATE(o.created_at) = CURRENT_DATE`);
  }
} 
else if (period === 'month') {
  if (start_date && end_date) {
    whereParts.push(`o.created_at::date BETWEEN $${idx} AND $${idx + 1}`);
    params.push(start_date, end_date);
    idx += 2;
  } else {
    whereParts.push(`DATE_TRUNC('month', o.created_at) = DATE_TRUNC('month', CURRENT_DATE)`);
  }
} 
else if (period === 'year') {
  if (start_date && end_date) {
    whereParts.push(`o.created_at::date BETWEEN $${idx} AND $${idx + 1}`);
    params.push(start_date, end_date);
    idx += 2;
  } else {
    whereParts.push(`DATE_TRUNC('year', o.created_at) = DATE_TRUNC('year', CURRENT_DATE)`);
  }
} 
else if (period === 'custom') {
  whereParts.push(`o.created_at::date BETWEEN $${idx} AND $${idx + 1}`);
  params.push(start_date, end_date);
  idx += 2;
}


    const whereClause = whereParts.join(' AND ');

    // If large and async requested (pdf or json), create report row and return id immediately
    if (isLargeReport) {
      // Save the request parameters and return report id
      const insertReportSQL = `INSERT INTO reports (business_id, branch_id, created_by, params, format, status) VALUES ($1,$2,$3,$4,$5,'pending') RETURNING id`;
      // created_by can be from auth (req.user.id) - optional; use null if not available
      const createdBy = (req.user && req.user.id) || null;
      const paramsJson = {
        query: req.query,
        requested_at: new Date().toISOString()
      };
      const rptRes = await pool.query(insertReportSQL, [business_id, branch_id || null, createdBy, paramsJson, format]);
      const reportId = rptRes.rows[0].id;
      // Worker/cron should pick up this row and process it.
      return res.status(202).json({
        message: 'Large report requested. Report is queued and will be processed asynchronously.',
        report_id: reportId,
        status_url: `/reports/status/${reportId}`
      });
    }

    // For small reports (<=30 days), compute synchronously. Use summary/details/payment/product options.

    // ---------- SUMMARY ----------
    let summaryData = {};
    if (String(summary) === 'true') {
      // If category filter is needed, the query needs the JOIN chain: order_items -> variants -> products -> product_category pc
      let summarySql = `
        SELECT
          COUNT(DISTINCT o.id)::int AS total_orders,
          COALESCE(SUM(o.subtotal),0)::numeric(12,2) AS subtotal,
          COALESCE(SUM(o.tax_total),0)::numeric(12,2) AS total_tax,
          COALESCE(SUM(o.discount_total + o.coupon_total),0)::numeric(12,2) AS total_discount,
          COALESCE(SUM(o.total_amount),0)::numeric(12,2) AS total_sales
        FROM orders o
      `;
      if (needCategoryJoin) {
        summarySql += ` JOIN order_items oi ON oi.order_id = o.id
                        JOIN variants v ON v.id = oi.variant_id
                        JOIN products p ON p.id = v.product_id
                        JOIN categories c ON c.id = p.category_id
                      `;
      }
      summarySql += ` WHERE ${whereClause}`;
      const summaryRes = await pool.query(summarySql, params);
      summaryData = summaryRes.rows[0] || { total_orders:0, subtotal:0, total_tax:0, total_discount:0, total_sales:0 };

      // COGS (use variant.cost_price if available)
      let cogsSql = `
        SELECT COALESCE(SUM(oi.quantity * COALESCE(v.cost_price, 0)),0)::numeric(12,2) AS total_cogs
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        LEFT JOIN variants v ON oi.variant_id = v.id
      `;
      if (needCategoryJoin) {
        cogsSql += ` JOIN products p ON p.id = v.product_id
                     JOIN categories c ON c.id = p.category_id `;
      }
      cogsSql += ` WHERE ${whereClause}`;
      const cogsRes = await pool.query(cogsSql, params);
      const totalCogs = Number(cogsRes.rows[0]?.total_cogs || 0);
      summaryData.total_cogs = totalCogs;
      summaryData.gross_profit = (Number(summaryData.total_sales) || 0) - totalCogs;
    }

    // ---------- DETAILS (paginate orders, then fetch items) ----------
    let orderDetails = [];
    let pagination = {};
    if (String(details) === 'true') {
      // Count total orders (not order_items)
      const countSql = `SELECT COUNT(*)::int AS total FROM orders o ${ needCategoryJoin ? ' JOIN order_items oi ON oi.order_id = o.id JOIN variants v ON v.id = oi.variant_id JOIN products p ON p.id = v.product_id JOIN categories c ON c.id = p.category_id ' : '' } WHERE ${whereClause}`;
      const countRes = await pool.query(countSql, params);
      const totalOrders = countRes.rows[0]?.total || 0;

      // fetch orders page
      const offset = (pageInt - 1) * pageSizeInt;
      const ordersPageSql = `
        SELECT o.*
        FROM orders o
        ${ needCategoryJoin ? ' JOIN order_items oi ON oi.order_id = o.id JOIN variants v ON v.id = oi.variant_id JOIN products p ON p.id = v.product_id JOIN categories c ON c.id = p.category_id ' : '' }
        WHERE ${whereClause}
        GROUP BY o.id
        ORDER BY o.created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;
      const ordersPageParams = [...params, pageSizeInt, offset];
      const ordersPageRes = await pool.query(ordersPageSql, ordersPageParams);
      const ordersPage = ordersPageRes.rows || [];
      const orderIds = ordersPage.map(r => r.id);
      // fetch items for those orders
      let itemsByOrder = {};
      if (orderIds.length) {
        const itemsSql = `
          SELECT oi.*, v.sku AS variant_sku, v.attributes, v.selling_price AS variant_selling_price
          FROM order_items oi
          LEFT JOIN variants v ON oi.variant_id = v.id
          WHERE oi.order_id = ANY($1)
          ORDER BY oi.id
        `;
        const itemsRes = await pool.query(itemsSql, [orderIds]);
        for (const row of itemsRes.rows) {
          if (!itemsByOrder[row.order_id]) itemsByOrder[row.order_id] = [];
          itemsByOrder[row.order_id].push(row);
        }
      }
      orderDetails = ordersPage.map(o => ({ ...o, items: itemsByOrder[o.id] || [] }));
      pagination = { page: pageInt, pageSize: pageSizeInt, total: totalOrders, totalPages: Math.ceil(totalOrders / pageSizeInt) };
    }

    // ---------- PAYMENT METHODS BREAKDOWN (from order_payments) ----------
    let paymentStats = [];
    if (String(payment_methods) === 'true') {
      // join orders to apply same whereClause, aggregate payments
      // Note: if category filter present, add join chain into FROM
      let paySql = `
        SELECT p.method,
               COUNT(DISTINCT p.order_id)::int AS orders_count,
               COALESCE(SUM(p.amount),0)::numeric(12,2) AS total_amount
        FROM order_payments p
        JOIN orders o ON p.order_id = o.id
      `;
      if (needCategoryJoin) {
        paySql += ` JOIN order_items oi ON oi.order_id = o.id JOIN variants v ON v.id = oi.variant_id JOIN products p2 ON p2.id = v.product_id JOIN product_category pc ON pc.category_id = p2.category_id `;
        // careful: we used alias p earlier for order_payments; rename product table alias to avoid conflict
      }
      paySql += ` WHERE ${whereClause} GROUP BY p.method ORDER BY total_amount DESC`;
      paymentStats = (await pool.query(paySql, params)).rows;
    }

    // ---------- PRODUCT BREAKDOWN ----------
    let productStats = [];
    if (String(product_breakdown) === 'true') {
      const prodSql = `
        SELECT
          oi.variant_id,
          COALESCE(v.sku, '') AS variant_sku,
          SUM(oi.quantity)::int AS total_qty,
          SUM(oi.quantity * COALESCE(oi.unit_price, v.selling_price, 0))::numeric(12,2) AS total_sales
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        LEFT JOIN variants v ON oi.variant_id = v.id
        LEFT JOIN products p ON v.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE ${whereClause}
        GROUP BY oi.variant_id, v.sku
        ORDER BY total_sales DESC
      `;
      productStats = (await pool.query(prodSql, params)).rows;
    }

    // Prepare final object
    const reportObj = {
      period,
      ...(period === 'custom' && { start_date, end_date }),
      summary: summaryData,
      order_details: orderDetails,
      ...(String(details) === 'true' && { pagination }),
      payment_methods: paymentStats,
      product_breakdown: productStats
    };

    // If PDF requested - render a small PDF and stream it.
    if (String(format).toLowerCase() === 'pdf') {
      // synchronous pdf for small report; if large reports we returned earlier
      const doc = new PDFDocument({ margin: 30, size: 'A4' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="sales_report_${Date.now()}.pdf"`);

      // pipe doc to response
      doc.pipe(res);

      // Title and meta
      doc.fontSize(18).text('Sales Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Business: ${business_id}   Branch: ${branch_id || 'all'}`);
      doc.text(`Period: ${period}${period === 'custom' ? ` (${start_date} to ${end_date})` : ''}`);
      doc.moveDown();

      // Summary block
      doc.fontSize(12).text('Summary', { underline: true });
      Object.entries(summaryData || {}).forEach(([k,v]) => {
        doc.fontSize(10).text(`${k}: ${v}`);
      });
      doc.moveDown();

      // Payment methods
      if (paymentStats && paymentStats.length) {
        doc.fontSize(12).text('Payments', { underline: true });
        paymentStats.forEach(p => {
          doc.fontSize(10).text(`${p.method}: ${p.orders_count} orders — ${p.total_amount}`);
        });
        doc.moveDown();
      }

      // Product breakdown
      if (productStats && productStats.length) {
        doc.fontSize(12).text('Top Products', { underline: true });
        productStats.slice(0, 25).forEach(p => {
          doc.fontSize(10).text(`${p.variant_sku || p.variant_id}: qty ${p.total_qty} — ${p.total_sales}`);
        });
        doc.moveDown();
      }

      // Optionally include details (first N orders)
      if (orderDetails && orderDetails.length) {
        doc.fontSize(12).text('Order Details (sample)', { underline: true });
        orderDetails.slice(0, 20).forEach(o => {
          doc.fontSize(10).text(`Order ${o.id} — ${o.total_amount} — ${o.created_at}`);
          (o.items || []).forEach(it => {
            doc.fontSize(9).text(`  - ${it.variant_id} x${it.quantity} @ ${it.unit_price}`);
          });
          doc.moveDown(0.2);
        });
      }

      doc.end();
      return;
    }

    // Default: return JSON
    return res.json(reportObj);

  } catch (err) {
    console.error('salesReport error:', err);
    return res.status(500).json({ error: 'Failed to generate sales report', details: err.message });
  }
};


exports.reportStatus = async (req, res) => {
  const { reportId } = req.params;

  try {
    const result = await pool.query(
      `SELECT id, status, format, result_path, error, created_at
       FROM reports
       WHERE id = $1`,
      [reportId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = result.rows[0];
    const response = {
      report_id: report.id,
      status: report.status,
      format: report.format,
      created_at: report.created_at,
    };

    if (report.status === 'completed') {
      response.download_url = `/reports/download/${report.id}`;
    }

    if (report.status === 'failed') {
      response.error = report.error;
    }

    res.json(response);
  } catch (err) {
    console.error('Report status error:', err);
    res.status(500).json({ error: 'Failed to fetch report status' });
  }
};

// Download completed report
exports.downloadReport = async (req, res) => {
  const { reportId } = req.params;

  try {
    const result = await pool.query(
      `SELECT id, status, format, result_path
       FROM reports
       WHERE id = $1`,
      [reportId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = result.rows[0];

    if (report.status !== 'completed') {
      return res.status(400).json({ error: 'Report not ready for download' });
    }

    if (!report.result_path) {
      return res.status(500).json({ error: 'No file path stored for this report' });
    }

    const filePath = path.resolve(report.result_path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Report file not found on server' });
    }

    res.download(filePath, `sales-report-${report.id}.${report.format}`);
  } catch (err) {
    console.error('Report download error:', err);
    res.status(500).json({ error: 'Failed to download report' });
  }
};

  exports.customerAnalytics = async (req, res) => {
  try {
    const { business_id, branch_id, period = 'month', start_date, end_date } = req.query;
    let params = [];
    let wheres = [];
    let idx = 1;
    if (business_id) { wheres.push(`c.business_id = $${idx}`); params.push(business_id); idx++; }
    if (branch_id) { wheres.push(`c.branch_id = $${idx}`); params.push(branch_id); idx++; }
    let whereClause = wheres.length > 0 ? 'WHERE ' + wheres.join(' AND ') : '';
    let dateWhere = '';
    if (start_date && end_date) dateWhere = ` AND c.created_at::date BETWEEN '${start_date}' AND '${end_date}'`;
    
    const topCustomersResult = await pool.query(
      `SELECT c.id, c.name, COUNT(o.id) AS orders, COALESCE(SUM(o.total_amount),0) AS total_spent
       FROM customers c
       LEFT JOIN orders o ON c.id = o.customer_id AND o.status = 'completed'
       ${whereClause}
       GROUP BY c.id, c.name
       ORDER BY total_spent DESC
       LIMIT 10`,
      params
    );
   
    const repeatRateResult = await pool.query(
      `SELECT COUNT(DISTINCT c.id) AS repeat_customers
       FROM customers c
       JOIN orders o ON c.id = o.customer_id AND o.status = 'completed'
       ${whereClause} AND (
         SELECT COUNT(*) FROM orders oo WHERE oo.customer_id = c.id AND oo.status = 'completed'
       ) > 1`,
      params
    );
  
    const newReturningResult = await pool.query(
      `SELECT
         SUM(CASE WHEN c.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 ELSE 0 END) AS new_customers,
         SUM(CASE WHEN c.created_at < CURRENT_DATE - INTERVAL '30 days' THEN 1 ELSE 0 END) AS returning_customers
       FROM customers c
       ${whereClause}`,
      params
    );
   
    const churnResult = await pool.query(
      `SELECT COUNT(*) AS churned_customers
       FROM customers c
       WHERE NOT EXISTS (
         SELECT 1 FROM orders o WHERE o.customer_id = c.id AND o.status = 'completed' AND o.created_at >= CURRENT_DATE - INTERVAL '90 days'
       )${wheres.length > 0 ? ' AND ' + wheres.join(' AND ') : ''}`,
      params
    );
    res.json({
      topCustomers: topCustomersResult.rows,
      repeatPurchaseRate: Number(repeatRateResult.rows[0]?.repeat_customers || 0),
      newCustomers: Number(newReturningResult.rows[0]?.new_customers || 0),
      returningCustomers: Number(newReturningResult.rows[0]?.returning_customers || 0),
      churnedCustomers: Number(churnResult.rows[0]?.churned_customers || 0)
    });
  } catch (err) {
    console.error('Customer analytics error:', err);
    res.status(500).json({ message: 'Failed to fetch customer analytics.' });
  }
};


exports.supplierAnalytics = async (req, res) => {
  try {
    const { business_id, date_filter, start_date, end_date } = req.query;
    let params = [];
    let wheres = [];
    let idx = 1;
    if (business_id) { wheres.push(`sos.business_id = $${idx}`); params.push(business_id); idx++; }
    let whereClause = wheres.length > 0 ? 'WHERE ' + wheres.join(' AND ') : '';

    let dateWhere = '';
    if (date_filter) {
      if (date_filter === 'today') dateWhere = ` AND sos.created_at::date = CURRENT_DATE`;
      else if (date_filter === 'yesterday') dateWhere = ` AND sos.created_at::date = CURRENT_DATE - INTERVAL '1 day'`;
      else if (date_filter === 'this_week') dateWhere = ` AND sos.created_at >= date_trunc('week', CURRENT_DATE)`;
      else if (date_filter === 'last_7_days') dateWhere = ` AND sos.created_at >= CURRENT_DATE - INTERVAL '7 days'`;
      else if (date_filter === 'this_month') dateWhere = ` AND sos.created_at >= date_trunc('month', CURRENT_DATE)`;
      else if (date_filter === 'this_year') dateWhere = ` AND sos.created_at >= date_trunc('year', CURRENT_DATE)`;
      else if (date_filter === 'custom' && start_date && end_date) dateWhere = ` AND sos.created_at::date BETWEEN '${start_date}' AND '${end_date}'`;
    } else if (start_date && end_date) {
      dateWhere = ` AND sos.created_at::date BETWEEN '${start_date}' AND '${end_date}'`;
    }

    
    const topSuppliersResult = await pool.query(
      `SELECT s.id, s.name, COUNT(sos.id) AS deliveries, COALESCE(SUM(sos.total_cost),0) AS total_supplied
       FROM suppliers s
       LEFT JOIN supply_orders sos ON s.id = sos.supplier_id
       ${whereClause}
       ${dateWhere}
       GROUP BY s.id, s.name
       ORDER BY total_supplied DESC
       LIMIT 10`,
      params
    );

   
    const delayedDeliveriesResult = await pool.query(
      `SELECT COUNT(*) AS delayed_deliveries
       FROM supply_orders sos
       WHERE sos.supply_status = 'paid'
         AND sos.expected_delivery_date < CURRENT_DATE
         ${wheres.length > 0 ? ' AND ' + wheres.join(' AND ') : ''}
         ${dateWhere}`,
      params
    );

   
    const costPerSupplierResult = await pool.query(
      `SELECT s.id, s.name,
              COALESCE(SUM(soi.quantity * soi.cost_price), 0) AS total_cost
       FROM suppliers s
       LEFT JOIN supply_orders sos ON s.id = sos.supplier_id
       LEFT JOIN supply_order_items soi ON sos.id = soi.supply_order_id
       ${whereClause}
       ${dateWhere}
       GROUP BY s.id, s.name
       ORDER BY total_cost DESC`,
      params
    );

    
    const reliabilityResult = await pool.query(
      `SELECT s.id,
              s.name,
              COUNT(sos.id) FILTER (WHERE sos.supply_status = 'delivered') AS total_deliveries,
              COUNT(sos.id) FILTER (
                WHERE sos.supply_status = 'delivered'
                  AND sos.expected_delivery_date >= sos.updated_at
              ) AS on_time_deliveries,
              CASE
                WHEN COUNT(sos.id) FILTER (WHERE sos.supply_status = 'delivered') = 0
                THEN 0
                ELSE ROUND(
                  COUNT(sos.id) FILTER (
                    WHERE sos.supply_status = 'delivered'
                      AND sos.expected_delivery_date >= sos.updated_at
                  )::decimal
                  / COUNT(sos.id) FILTER (WHERE sos.supply_status = 'delivered') * 100,
                2)
              END AS reliability_percent
       FROM suppliers s
       LEFT JOIN supply_orders sos ON s.id = sos.supplier_id
       ${whereClause}
       ${dateWhere}
       GROUP BY s.id, s.name
       ORDER BY reliability_percent DESC`,
      params
    );

    
    const activeSuppliersResult = await pool.query(
      `SELECT COUNT(DISTINCT s.id) AS active_suppliers
       FROM suppliers s
       JOIN supply_orders sos ON s.id = sos.supplier_id
       ${whereClause}
       ${dateWhere}`,
      params
    );

   
    const dormantSuppliersResult = await pool.query(
      `SELECT COUNT(*) AS dormant_suppliers
       FROM suppliers s
       WHERE NOT EXISTS (
         SELECT 1 FROM supply_orders sos WHERE sos.supplier_id = s.id
         ${business_id ? 'AND sos.business_id = $1' : ''}
       )
       ${business_id ? 'AND s.business_id = $1' : ''}`,
      business_id ? [business_id] : []
    );

    
    const supplyOrderStatsResult = await pool.query(
      `SELECT s.id, s.name, 
              COUNT(DISTINCT sos.id) AS supply_order_count,
              COALESCE(SUM(soi.quantity), 0) AS total_qty_supplied
       FROM suppliers s
       LEFT JOIN supply_orders sos ON s.id = sos.supplier_id
       LEFT JOIN supply_order_items soi ON sos.id = soi.supply_order_id
       ${whereClause}
       ${dateWhere}
       GROUP BY s.id, s.name
       ORDER BY supply_order_count DESC`,
      params
    );

    res.json({
      topSuppliers: topSuppliersResult.rows,
      delayedDeliveries: Number(delayedDeliveriesResult.rows[0]?.delayed_deliveries || 0),
      costPerSupplier: costPerSupplierResult.rows,
      supplierReliability: reliabilityResult.rows,
      activeSuppliers: Number(activeSuppliersResult.rows[0]?.active_suppliers || 0),
      dormantSuppliers: Number(dormantSuppliersResult.rows[0]?.dormant_suppliers || 0),
      supplyOrderStats: supplyOrderStatsResult.rows
    });
  } catch (err) {
    console.error('Supplier analytics error:', err);
    res.status(500).json({ message: 'Failed to fetch supplier analytics.' });
  }
};


exports.expenseAnalytics = async (req, res) => {
  try {
    const { business_id, branch_id, date_filter, start_date, end_date } = req.query;
    let params = [];
    let wheres = [];
    let idx = 1;
    if (business_id) { wheres.push(`e.business_id = $${idx}`); params.push(business_id); idx++; }
    if (branch_id) { wheres.push(`e.branch_id = $${idx}`); params.push(branch_id); idx++; }
    let whereClause = wheres.length > 0 ? 'WHERE ' + wheres.join(' AND ') : '';

    let dateWhere = '';
    if (date_filter) {
      if (date_filter === 'today') dateWhere = ` AND e.created_at::date = CURRENT_DATE`;
      else if (date_filter === 'yesterday') dateWhere = ` AND e.created_at::date = CURRENT_DATE - INTERVAL '1 day'`;
      else if (date_filter === 'this_week') dateWhere = ` AND e.created_at >= date_trunc('week', CURRENT_DATE)`;
      else if (date_filter === 'last_7_days') dateWhere = ` AND e.created_at >= CURRENT_DATE - INTERVAL '7 days'`;
      else if (date_filter === 'this_month') dateWhere = ` AND e.created_at >= date_trunc('month', CURRENT_DATE)`;
      else if (date_filter === 'this_year') dateWhere = ` AND e.created_at >= date_trunc('year', CURRENT_DATE)`;
      else if (date_filter === 'custom' && start_date && end_date) dateWhere = ` AND e.created_at::date BETWEEN '${start_date}' AND '${end_date}'`;
    } else if (start_date && end_date) {
      dateWhere = ` AND e.created_at::date BETWEEN '${start_date}' AND '${end_date}'`;
    }

    const whereClauseWithDate = whereClause + (dateWhere ? dateWhere : '');

    const monthlyExpensesResult = await pool.query(
      `SELECT DATE_TRUNC('month', e.created_at) AS month, SUM(e.amount) AS total_expense
       FROM expenses e
       ${whereClauseWithDate}
       GROUP BY month
       ORDER BY month DESC`,
      params
    );

    const topExpenseCategoriesResult = await pool.query(
      `SELECT ec.name AS category, SUM(e.amount) AS total_expense
       FROM expenses e
       JOIN expense_categories ec ON e.category_id = ec.id
       ${whereClauseWithDate}
       GROUP BY ec.name
       ORDER BY total_expense DESC
       LIMIT 5`,
      params
    );

    const anomalyResult = await pool.query(
      `SELECT e.id, e.amount, ec.name AS category, e.created_at
       FROM expenses e
       JOIN expense_categories ec ON e.category_id = ec.id
       ${whereClauseWithDate}
       AND e.amount > 2 * (SELECT AVG(amount) FROM expenses WHERE status = 'approved')`,
      params
    );

    res.json({
      monthlyExpenses: monthlyExpensesResult.rows,
      topExpenseCategories: topExpenseCategoriesResult.rows,
      anomalies: anomalyResult.rows
    });
  } catch (err) {
    console.error('Expense analytics error:', err);
    res.status(500).json({ message: 'Failed to fetch expense analytics.' });
  }
};


exports.serviceAnalytics = async (req, res) => {
  try {
    const { business_id, branch_id, date_filter, start_date, end_date } = req.query;
    let params = [];
    let wheres = [];
    let idx = 1;
    if (business_id) { wheres.push(`s.business_id = $${idx}`); params.push(business_id); idx++; }
    if (branch_id) { wheres.push(`s.branch_id = $${idx}`); params.push(branch_id); idx++; }
    let whereClause = wheres.length > 0 ? 'WHERE ' + wheres.join(' AND ') : '';
    let dateWhere = '';
    if (date_filter) {
      if (date_filter === 'today') dateWhere = ` AND a.created_at::date = CURRENT_DATE`;
      else if (date_filter === 'yesterday') dateWhere = ` AND a.created_at::date = CURRENT_DATE - INTERVAL '1 day'`;
      else if (date_filter === 'this_week') dateWhere = ` AND a.created_at >= date_trunc('week', CURRENT_DATE)`;
      else if (date_filter === 'last_7_days') dateWhere = ` AND a.created_at >= CURRENT_DATE - INTERVAL '7 days'`;
      else if (date_filter === 'this_month') dateWhere = ` AND a.created_at >= date_trunc('month', CURRENT_DATE)`;
      else if (date_filter === 'this_year') dateWhere = ` AND a.created_at >= date_trunc('year', CURRENT_DATE)`;  
      else if (date_filter === 'custom' && start_date && end_date) dateWhere = ` AND a.created_at::date BETWEEN '${start_date}' AND '${end_date}'`;
    } else if (start_date && end_date) {
      dateWhere = ` AND a.created_at::date BETWEEN '${start_date}' AND '${end_date}'`;
    }
    
    
    const usageResult = await pool.query(
      `SELECT s.id, s.name, COUNT(a.id) AS usage_count, SUM(s.price) AS total_revenue
       FROM services s
       LEFT JOIN appointments a ON s.id = a.service_id
       ${whereClause}${dateWhere}
       GROUP BY s.id, s.name
       ORDER BY usage_count DESC`,
      params
    );
   
    const staffPerfResult = await pool.query(
      `SELECT s.id AS service_id, s.name AS service_name, a.staff_id, COUNT(a.id) AS appointments, SUM(s.price) AS revenue
       FROM services s
       LEFT JOIN appointments a ON s.id = a.service_id
       ${whereClause}${dateWhere}
       GROUP BY s.id, s.name, a.staff_id
       ORDER BY revenue DESC`,
      params
    );
    res.json({
      serviceUsage: usageResult.rows,
      staffPerformance: staffPerfResult.rows
    });
  } catch (err) {
    console.error('Service analytics error:', err);
    res.status(500).json({ message: 'Failed to fetch service analytics.' });
  }
};


exports.inventoryAnalytics = async (req, res) => {
  try {
    const { business_id, date_filter, start_date, end_date } = req.query;
    let params = [];
    let wheres = [];
    let idx = 1;
    if (business_id) { wheres.push(`p.business_id = $${idx}`); params.push(business_id); idx++; }
    let whereClause = wheres.length > 0 ? 'WHERE ' + wheres.join(' AND ') : '';

    let dateWhere = '';
    if (date_filter) {
      if (date_filter === 'today') dateWhere = ` AND v.created_at::date = CURRENT_DATE`;
      else if (date_filter === 'yesterday') dateWhere = ` AND v.created_at::date = CURRENT_DATE - INTERVAL '1 day'`;
      else if (date_filter === 'this_week') dateWhere = ` AND v.created_at >= date_trunc('week', CURRENT_DATE)`;
      else if (date_filter === 'last_7_days') dateWhere = ` AND v.created_at >= CURRENT_DATE - INTERVAL '7 days'`;
      else if (date_filter === 'this_month') dateWhere = ` AND v.created_at >= date_trunc('month', CURRENT_DATE)`;
      else if (date_filter === 'this_year') dateWhere = ` AND v.created_at >= date_trunc('year', CURRENT_DATE)`;
      else if (date_filter === 'custom' && start_date && end_date) dateWhere = ` AND v.created_at::date BETWEEN '${start_date}' AND '${end_date}'`;
    }


    const turnoverResult = await pool.query(
      `SELECT p.id, p.name, COALESCE(SUM(oi.quantity),0) AS units_sold, COALESCE(SUM(v.quantity),0) AS current_stock,
        CASE WHEN SUM(v.quantity) > 0 THEN SUM(oi.quantity)::float / SUM(v.quantity) ELSE 0 END AS turnover_ratio
       FROM products p
       LEFT JOIN variants v ON p.id = v.product_id
       LEFT JOIN order_items oi ON v.id = oi.variant_id
       ${whereClause}
       GROUP BY p.id, p.name
       ORDER BY turnover_ratio DESC`,
      params
    );

  
    const agingResult = await pool.query(
      `SELECT v.id, p.name AS product, v.quantity, v.created_at
       FROM variants v
       JOIN products p ON v.product_id = p.id
       ${whereClause}
       AND v.quantity > 0 AND v.created_at < CURRENT_DATE - INTERVAL '180 days'${dateWhere}`,
      params
    );

   
    const deadStockResult = await pool.query(
      `SELECT v.id, p.name AS product, v.quantity
       FROM variants v
       JOIN products p ON v.product_id = p.id
       ${whereClause}
       AND v.quantity > 0 AND v.quantity = v.initial_quantity${dateWhere}`,
      params
    );
    res.json({
      turnover: turnoverResult.rows,
      agingStock: agingResult.rows,
      deadStock: deadStockResult.rows
    });
  } catch (err) {
    console.error('Inventory analytics error:', err);
    res.status(500).json({ message: 'Failed to fetch inventory analytics.' });
  }
};


exports.discountAnalytics = async (req, res) => {
  try {
    const { business_id, date_filter, start_date, end_date } = req.query;
    let params = [];
    let wheres = [];
    let idx = 1;
    if (business_id) { wheres.push(`o.business_id = $${idx}`); params.push(business_id); idx++; }
    let whereClause = wheres.length > 0 ? 'WHERE ' + wheres.join(' AND ') : '';

    let dateWhere = '';
    if (date_filter) {
      if (date_filter === 'today') dateWhere = ` AND o.created_at::date = CURRENT_DATE`;
      else if (date_filter === 'yesterday') dateWhere = ` AND o.created_at::date = CURRENT_DATE - INTERVAL '1 day'`;
      else if (date_filter === 'this_week') dateWhere = ` AND o.created_at >= date_trunc('week', CURRENT_DATE)`;
      else if (date_filter === 'last_7_days') dateWhere = ` AND o.created_at >= CURRENT_DATE - INTERVAL '7 days'`;
      else if (date_filter === 'this_month') dateWhere = ` AND o.created_at >= date_trunc('month', CURRENT_DATE)`;
      else if (date_filter === 'this_year') dateWhere = ` AND o.created_at >= date_trunc('year', CURRENT_DATE)`;
      else if (date_filter === 'custom' && start_date && end_date) dateWhere = ` AND o.created_at::date BETWEEN '${start_date}' AND '${end_date}'`;
    }

   
    const topDiscountsResult = await pool.query(
      `SELECT d.code, COUNT(*) AS usage_count, SUM(d.amount) AS total_discount
       FROM discounts d
       JOIN orders o ON d.code = o.discount_code
       ${whereClause.replace('WHERE', 'WHERE o.status = \'completed\' AND')}
       ${dateWhere}
       GROUP BY d.code
       ORDER BY usage_count DESC
       LIMIT 10`,
      params
    );

    
    const upliftResult = await pool.query(
      `SELECT d.code, SUM(o.total_amount) AS sales_uplift
       FROM discounts d
       JOIN orders o ON d.code = o.discount_code
       ${whereClause.replace('WHERE', 'WHERE o.status = \'completed\' AND')}
       ${dateWhere}
       GROUP BY d.code
       ORDER BY sales_uplift DESC`,
      params
    );

    const redemptionResult = await pool.query(
      `SELECT d.code, COUNT(*) AS redemptions, DATE_TRUNC('month', o.created_at) AS month
       FROM discounts d
       JOIN orders o ON d.code = o.discount_code
       ${whereClause.replace('WHERE', 'WHERE o.status = \'completed\' AND')}
       ${dateWhere}
       GROUP BY d.code, month
       ORDER BY month DESC, redemptions DESC`,
      params
    );

   
    const unusedDiscountsResult = await pool.query(
      `SELECT d.code, d.amount, d.percentage
       FROM discounts d
       LEFT JOIN orders o ON d.code = o.discount_code
       WHERE o.id IS NULL
       ${business_id ? 'AND d.business_id = $1' : ''}
       ORDER BY d.created_at DESC`,
      business_id ? [business_id] : []
    );

   
    const highestPercentageResult = await pool.query(
      `SELECT code, percentage
       FROM discounts
       ${business_id ? 'WHERE business_id = $1' : ''}
       ORDER BY percentage DESC NULLS LAST
       LIMIT 1`,
      business_id ? [business_id] : []
    );

   
    const leastUsedDiscountResult = await pool.query(
      `SELECT d.code, COUNT(o.id) AS usage_count
       FROM discounts d
       JOIN orders o ON d.code = o.discount_code
       ${whereClause.replace('WHERE', 'WHERE o.status = \'completed\' AND')}
       ${dateWhere}
       GROUP BY d.code
       HAVING COUNT(o.id) > 0
       ORDER BY usage_count ASC
       LIMIT 1`,
      params
    );

    res.json({
      topDiscounts: topDiscountsResult.rows,
      salesUplift: upliftResult.rows,
      redemptionTrends: redemptionResult.rows,
      unusedDiscounts: unusedDiscountsResult.rows,
      highestPercentage: highestPercentageResult.rows[0] || null,
      leastUsedDiscount: leastUsedDiscountResult.rows[0] || null
    });
  } catch (err) {
    console.error('Discount analytics error:', err);
    res.status(500).json({ message: 'Failed to fetch discount analytics.' });
  }
};


exports.auditLogAnalytics = async (req, res) => {
  try {
    const { business_id, branch_id, date_filter, start_date, end_date } = req.query;
    let params = [];
    let wheres = [];
    let idx = 1;
    if (business_id) { wheres.push(`a.business_id = $${idx}`); params.push(business_id); idx++; }
    if (branch_id) { wheres.push(`a.branch_id = $${idx}`); params.push(branch_id); idx++; }
    let whereClause = wheres.length > 0 ? 'WHERE ' + wheres.join(' AND ') : '';

       let dateWhere = '';
    if (date_filter) {
      if (date_filter === 'today') dateWhere = ` AND a.created_at::date = CURRENT_DATE`;
      else if (date_filter === 'yesterday') dateWhere = ` AND a.created_at::date = CURRENT_DATE - INTERVAL '1 day'`;
      else if (date_filter === 'this_week') dateWhere = ` AND a.created_at >= date_trunc('week', CURRENT_DATE)`;
      else if (date_filter === 'last_7_days') dateWhere = ` AND a.created_at >= CURRENT_DATE - INTERVAL '7 days'`;
      else if (date_filter === 'this_month') dateWhere = ` AND a.created_at >= date_trunc('month', CURRENT_DATE)`;
      else if (date_filter === 'this_year') dateWhere = ` AND a.created_at >= date_trunc('year', CURRENT_DATE)`;
      else if (date_filter === 'custom' && start_date && end_date) dateWhere = ` AND a.created_at::date BETWEEN '${start_date}' AND '${end_date}'`;
    }
  
    const activeUsersResult = await pool.query(
      `SELECT a.user_id, COUNT(*) AS actions
       FROM audit_logs a
       ${whereClause}
        ${dateWhere}
       GROUP BY a.user_id
       ORDER BY actions DESC
       LIMIT 10`,
      params
    );
    
    const frequentActionsResult = await pool.query(
      `SELECT a.action, COUNT(*) AS count
       FROM audit_logs a
       ${whereClause}
       ${dateWhere}
       GROUP BY a.action
       ORDER BY count DESC
       LIMIT 10`,
      params
    );
   
    const suspiciousResult = await pool.query(
      `SELECT a.id, a.user_id, a.action, a.created_at
       FROM audit_logs a
       ${whereClause}
       ${dateWhere}
       WHERE a.action IN ('failed_login', 'permission_error')
       ORDER BY a.created_at DESC
       LIMIT 20`,
      params
    );
    res.json({
      activeUsers: activeUsersResult.rows,
      frequentActions: frequentActionsResult.rows,
      suspiciousActivities: suspiciousResult.rows
    });
  } catch (err) {
    console.error('Audit log analytics error:', err);
    res.status(500).json({ message: 'Failed to fetch audit log analytics.' });
  }
};


exports.appointmentAnalytics = async (req, res) => {
  try {
    const { business_id, branch_id, date_filter, start_date, end_date } = req.query;
    let params = [];
    let wheres = [];
    let idx = 1;
    if (business_id) { wheres.push(`a.business_id = $${idx}`); params.push(business_id); idx++; }
    if (branch_id) { wheres.push(`a.branch_id = $${idx}`); params.push(branch_id); idx++; }
    let whereClause = wheres.length > 0 ? 'WHERE ' + wheres.join(' AND ') : '';

       let dateWhere = '';
    if (date_filter) {
      if (date_filter === 'today') dateWhere = ` AND a.created_at::date = CURRENT_DATE`;
      else if (date_filter === 'yesterday') dateWhere = ` AND a.created_at::date = CURRENT_DATE - INTERVAL '1 day'`;
      else if (date_filter === 'this_week') dateWhere = ` AND a.created_at >= date_trunc('week', CURRENT_DATE)`;
      else if (date_filter === 'last_7_days') dateWhere = ` AND a.created_at >= CURRENT_DATE - INTERVAL '7 days'`;
      else if (date_filter === 'this_month') dateWhere = ` AND a.created_at >= date_trunc('month', CURRENT_DATE)`;
      else if (date_filter === 'this_year') dateWhere = ` AND a.created_at >= date_trunc('year', CURRENT_DATE)`;
      else if (date_filter === 'custom' && start_date && end_date) dateWhere = ` AND a.created_at::date BETWEEN '${start_date}' AND '${end_date}'`;
    }
    
    const bookingsResult = await pool.query(
      `SELECT COUNT(*) AS total_bookings, SUM(s.price) AS total_revenue
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       ${whereClause}
        ${dateWhere}
       WHERE a.status = 'booked'`,
      params
    );
    const cancellationsResult = await pool.query(
      `SELECT COUNT(*) AS cancellations
       FROM appointments a
       ${whereClause}
        ${dateWhere}
       WHERE a.status = 'cancelled'`,
      params
    );
    const noShowsResult = await pool.query(
      `SELECT COUNT(*) AS no_shows
       FROM appointments a
       ${whereClause}
        ${dateWhere}
       WHERE a.status = 'no_show'`,
      params
    );
    res.json({
      bookings: bookingsResult.rows[0],
      cancellations: Number(cancellationsResult.rows[0]?.cancellations || 0),
      noShows: Number(noShowsResult.rows[0]?.no_shows || 0)
    });
  } catch (err) {
    console.error('Appointment analytics error:', err);
    res.status(500).json({ message: 'Failed to fetch appointment analytics.' });
  }
};


exports.loyaltyAnalytics = async (req, res) => {
  try {
    const { business_id, branch_id, date_filter, start_date, end_date } = req.query;
    let params = [];
    let wheres = [];
    let idx = 1;
    if (business_id) { wheres.push(`l.business_id = $${idx}`); params.push(business_id); idx++; }
    if (branch_id) { wheres.push(`l.branch_id = $${idx}`); params.push(branch_id); idx++; }
    let whereClause = wheres.length > 0 ? 'WHERE ' + wheres.join(' AND ') : '';

       let dateWhere = '';
    if (date_filter) {
      if (date_filter === 'today') dateWhere = ` AND l.created_at::date = CURRENT_DATE`;
      else if (date_filter === 'yesterday') dateWhere = ` AND l.created_at::date = CURRENT_DATE - INTERVAL '1 day'`;
      else if (date_filter === 'this_week') dateWhere = ` AND l.created_at >= date_trunc('week', CURRENT_DATE)`;
      else if (date_filter === 'last_7_days') dateWhere = ` AND l.created_at >= CURRENT_DATE - INTERVAL '7 days'`;
      else if (date_filter === 'this_month') dateWhere = ` AND l.created_at >= date_trunc('month', CURRENT_DATE)`;
      else if (date_filter === 'this_year') dateWhere = ` AND l.created_at >= date_trunc('year', CURRENT_DATE)`;
      else if (date_filter === 'custom' && start_date && end_date) dateWhere = ` AND l.created_at::date BETWEEN '${start_date}' AND '${end_date}'`;
    }
   
    const accrualResult = await pool.query(
      `SELECT l.customer_id, SUM(l.points) AS total_points
       FROM loyalty_points l
       ${whereClause}
       ${dateWhere}
       GROUP BY l.customer_id
       ORDER BY total_points DESC
       LIMIT 10`,
      params
    );
    
    const redemptionResult = await pool.query(
      `SELECT l.customer_id, SUM(l.points) AS redeemed_points
       FROM loyalty_points l
       ${whereClause}
        ${dateWhere}
       WHERE l.type = 'redeem'
       GROUP BY l.customer_id
       ORDER BY redeemed_points DESC
       LIMIT 10`,
      params
    );
    res.json({
      accrual: accrualResult.rows,
      redemption: redemptionResult.rows
    });
  } catch (err) {
    console.error('Loyalty analytics error:', err);
    res.status(500).json({ message: 'Failed to fetch loyalty analytics.' });
  }
};


exports.realtimeAnalytics = async (req, res) => {
  try {
    
    const latestSales = await pool.query(
      `SELECT o.id, o.total_amount, o.created_at FROM orders o WHERE o.status = 'completed' ORDER BY o.created_at DESC LIMIT 10`
    );
    const latestStock = await pool.query(
      `SELECT v.id, v.quantity, v.updated_at FROM variants v ORDER BY v.updated_at DESC LIMIT 10`
    );
    const latestStaff = await pool.query(
      `SELECT s.id, s.name, sa.action, sa.created_at FROM staff_actions sa JOIN staff s ON sa.staff_id = s.id ORDER BY sa.created_at DESC LIMIT 10`
    );
    res.json({
      latestSales: latestSales.rows,
      latestStock: latestStock.rows,
      latestStaff: latestStaff.rows
    });
  } catch (err) {
    console.error('Real-time analytics error:', err);
    res.status(500).json({ message: 'Failed to fetch real-time analytics.' });
  }
};


exports.categoryStockDistribution = async (req, res) => {
  try {
    const { business_id, date_filter, start_date, end_date } = req.query;
    if (!business_id) return res.status(400).json({ message: 'business_id is required.' });

    let dateWhere = '';
    if (date_filter) {
      if (date_filter === 'today') dateWhere = ` AND v.updated_at::date = CURRENT_DATE`;
      else if (date_filter === 'yesterday') dateWhere = ` AND v.updated_at::date = CURRENT_DATE - INTERVAL '1 day'`;
      else if (date_filter === 'last_7_days') dateWhere = ` AND v.updated_at >= CURRENT_DATE - INTERVAL '7 days'`;
      else if (date_filter === 'this_month') dateWhere = ` AND v.updated_at >= date_trunc('month', CURRENT_DATE)`;
      else if (date_filter === 'this_year') dateWhere = ` AND v.updated_at >= date_trunc('year', CURRENT_DATE)`;
      else if (date_filter === 'custom' && start_date && end_date) dateWhere = ` AND v.updated_at::date BETWEEN '${start_date}' AND '${end_date}'`;
    }

    const result = await pool.query(
      `SELECT c.id AS category_id, c.name AS category_name, 
              COALESCE(SUM(v.quantity), 0) AS total_stock
         FROM categories c
         JOIN products p ON c.id = p.category_id
         JOIN variants v ON p.id = v.product_id
         WHERE c.business_id = $1${dateWhere}
         GROUP BY c.id, c.name
         ORDER BY total_stock DESC`,
      [business_id]
    );

    res.status(200).json({ categories: result.rows });
  } catch (err) {
    console.error('Category stock distribution error:', err);
    res.status(500).json({ message: 'Failed to fetch category stock distribution.' });
  }
};


exports.salesOverView = async (req, res) => {
  try {
    const { business_id, branch_id, page = 1, pageSize = 20 } = req.query;
    if (!business_id) {
      return res.status(400).json({ message: 'business_id is required.' });
    }

    const pageInt = parseInt(page, 10);
    const pageSizeInt = parseInt(pageSize, 10);
    const offset = (pageInt - 1) * pageSizeInt;

    let params = [business_id];
    let wheres = ['p.business_id = $1'];
    let idx = 2;

    if (branch_id) {
      wheres.push(`p.branch_id = $${idx}`);
      params.push(branch_id);
      idx++;
    }

    // Count total variants for pagination
    const countRes = await pool.query(
      `SELECT COUNT(DISTINCT v.id) AS total
       FROM variants v
       JOIN products p ON v.product_id = p.id
       JOIN order_items oi ON v.id = oi.variant_id
       JOIN orders o ON oi.order_id = o.id
       WHERE o.status = 'completed' AND ${wheres.join(' AND ')}`,
      params
    );
    const total = Number(countRes.rows[0]?.total || 0);

    // Main query: sales overview per variant
    const result = await pool.query(
      `SELECT
          v.id AS variant_id,
          v.sku,        
          v.selling_price,
          v.cost_price,
          p.name AS product_name,
          COALESCE(SUM(oi.quantity), 0) AS units_sold,
          COALESCE(SUM(oi.total_price), 0) AS revenue
        FROM variants v
        JOIN products p ON v.product_id = p.id
        JOIN order_items oi ON v.id = oi.variant_id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status = 'completed' AND ${wheres.join(' AND ')}
        GROUP BY v.id, v.sku, v.selling_price, v.cost_price, p.name
        ORDER BY revenue DESC
        LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, pageSizeInt, offset]
    );

    return res.status(200).json({
      page: pageInt,
      pageSize: pageSizeInt,
      total,
      totalPages: Math.ceil(total / pageSizeInt),
      variants: result.rows
    });
  } catch (err) {
    console.error('Sales overview error:', err);
    return res.status(500).json({ message: 'Failed to fetch sales overview.', error: err.message });
  }
};