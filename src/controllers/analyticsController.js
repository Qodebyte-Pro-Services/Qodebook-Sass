// analyticsController.js
const pool = require('../config/db');

module.exports = {
  overview: async (req, res) => {
    try {
      // Optionally, get business_id from req.user or query
      const business_id = req.query.business_id || req.user?.business_id;

      // Sales by Category
      const salesByCategoryResult = await pool.query(`
        SELECT c.name AS category, SUM(oi.total_price) AS total_sales
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN variants v ON oi.variant_id = v.id
        JOIN products p ON v.product_id = p.id
        JOIN categories c ON p.category_id = c.id
        WHERE o.status = 'completed'${business_id ? ' AND o.business_id = $1' : ''}
        GROUP BY c.name
        ORDER BY total_sales DESC
      `, business_id ? [business_id] : []);

      // Expenses by Category
      const expenseByCategoryResult = await pool.query(`
        SELECT ec.name AS category, SUM(e.amount) AS total_expense
        FROM expenses e
        JOIN expense_categories ec ON e.category_id = ec.id
        ${business_id ? 'WHERE e.business_id = $1' : ''}
        GROUP BY ec.name
        ORDER BY total_expense DESC
      `, business_id ? [business_id] : []);

      // Budgets by Category
      const budgetByCategoryResult = await pool.query(`
        SELECT ec.name AS category, SUM(b.amount) AS total_budget
        FROM budgets b
        JOIN expense_categories ec ON b.category_id = ec.id
        ${business_id ? 'WHERE b.business_id = $1' : ''}
        GROUP BY ec.name
        ORDER BY total_budget DESC
      `, business_id ? [business_id] : []);

      // Gross Income (total sales)
      const grossIncomeResult = await pool.query(
        `SELECT SUM(total_amount) AS gross_income FROM orders WHERE status = 'completed'${business_id ? ' AND business_id = $1' : ''}`,
        business_id ? [business_id] : []
      );

      // Total Expenses
      const totalExpenseResult = await pool.query(
        `SELECT SUM(amount) AS total_expense FROM expenses${business_id ? ' WHERE business_id = $1' : ''}`,
        business_id ? [business_id] : []
      );

      // Net Income = Gross Income - Expenses
      const grossIncome = Number(grossIncomeResult.rows[0]?.gross_income || 0);
      const totalExpense = Number(totalExpenseResult.rows[0]?.total_expense || 0);
      const netIncome = grossIncome - totalExpense;

      // Top Products (by sales)
      const topProductsResult = await pool.query(`
        SELECT p.name, SUM(oi.quantity) AS units_sold, SUM(oi.total_price) AS total_sales
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN variants v ON oi.variant_id = v.id
        JOIN products p ON v.product_id = p.id
        WHERE o.status = 'completed'${business_id ? ' AND o.business_id = $1' : ''}
        GROUP BY p.name
        ORDER BY total_sales DESC
        LIMIT 5
      `, business_id ? [business_id] : []);


      const discountsResult = await pool.query(`
        SELECT COALESCE(SUM(d.amount), 0) + COALESCE(SUM(c.discount_amount), 0) AS total_discounts
        FROM discounts d
        FULL OUTER JOIN coupons c ON d.business_id = c.business_id
        ${business_id ? 'WHERE d.business_id = $1 OR c.business_id = $1' : ''}
      `, business_id ? [business_id] : []);
      const discounts = Number(discountsResult.rows[0]?.total_discounts || 0);

     
      const taxesResult = await pool.query(`
        SELECT COALESCE(SUM(rate), 0) AS total_tax_rate
        FROM taxes
        ${business_id ? 'WHERE business_id = $1' : ''}
      `, business_id ? [business_id] : []);
      const taxes = Number(taxesResult.rows[0]?.total_tax_rate || 0);

  
      const staffSalaryResult = await pool.query(
        `SELECT COALESCE(SUM(salary), 0) AS total_staff_salary_paid FROM staff WHERE payment_status = 'paid'${business_id ? ' AND business_id = $1' : ''}`,
        business_id ? [business_id] : []
      );
      const totalStaffSalaryPaid = Number(staffSalaryResult.rows[0]?.total_staff_salary_paid || 0);

      res.json({
        salesByCategory: salesByCategoryResult.rows,
        expenseByCategory: expenseByCategoryResult.rows,
        budgetByCategory: budgetByCategoryResult.rows,
        grossIncome,
        netIncome,
        topProducts: topProductsResult.rows,
        discounts,
        taxes,
        totalStaffSalaryPaid
      });
    } catch (err) {
      console.error('Analytics overview error:', err);
      res.status(500).json({ message: 'Failed to fetch analytics overview.' });
    }
  },
};
