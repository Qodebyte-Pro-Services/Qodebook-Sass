// analyticsController.js
const pool = require('../config/db');

module.exports = {
  overview: async (req, res) => {
    try {
      const business_id = req.query.business_id || req.user?.business_id;
      const branch_id = req.query.branch_id;
      // Helper for query param array
      const params = [];
      let whereBusiness = '';
      let whereBusinessBranch = '';
      if (business_id) {
        params.push(business_id);
        whereBusiness = 'business_id = $' + params.length;
      }
      if (branch_id) {
        params.push(branch_id);
        whereBusinessBranch = (whereBusiness ? whereBusiness + ' AND ' : '') + 'branch_id = $' + params.length;
      }
      const whereClause = whereBusinessBranch || whereBusiness;
      // 1. Sales by Category
      const salesByCategoryResult = await pool.query(`
        SELECT c.name AS category, SUM(oi.total_price) AS total_sales
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN variants v ON oi.variant_id = v.id
        JOIN products p ON v.product_id = p.id
        JOIN categories c ON p.category_id = c.id
        WHERE o.status = 'completed'${whereClause ? ' AND o.' + whereClause : ''}
        GROUP BY c.name
        ORDER BY total_sales DESC
      `, params);
      // 2. Expense by Category
      const expenseByCategoryResult = await pool.query(`
        SELECT ec.name AS category, SUM(e.amount) AS total_expense
        FROM expenses e
        JOIN expense_categories ec ON e.category_id = ec.id
        WHERE e.status = 'approved'${whereClause ? ' AND e.' + whereClause : ''}
        GROUP BY ec.name
        ORDER BY total_expense DESC
      `, params);
      // 3. Budget by Category
      const budgetByCategoryResult = await pool.query(`
        SELECT ec.name AS category, SUM(b.amount) AS total_budget
        FROM budgets b
        JOIN expense_categories ec ON b.category_id = ec.id
        ${whereClause ? 'WHERE b.' + whereClause : ''}
        GROUP BY ec.name
        ORDER BY total_budget DESC
      `, params);
      // 4. Gross/Net Income
      const grossIncomeResult = await pool.query(
        `SELECT SUM(total_amount) AS gross_income FROM orders WHERE status = 'completed'${whereClause ? ' AND ' + whereClause : ''}`,
        params
      );
      const totalExpenseResult = await pool.query(
        `SELECT SUM(amount) AS total_expense FROM expenses WHERE status = 'approved'${whereClause ? ' AND ' + whereClause : ''}`,
        params
      );
      const grossIncome = Number(grossIncomeResult.rows[0]?.gross_income || 0);
      const totalExpense = Number(totalExpenseResult.rows[0]?.total_expense || 0);
      const netIncome = grossIncome - totalExpense;
   
      const topProductsResult = await pool.query(`
        SELECT p.name, SUM(oi.quantity) AS units_sold, SUM(oi.total_price) AS total_sales
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN variants v ON oi.variant_id = v.id
        JOIN products p ON v.product_id = p.id
        WHERE o.status = 'completed'${whereClause ? ' AND o.' + whereClause : ''}
        GROUP BY p.name
        ORDER BY total_sales DESC
        LIMIT 5
      `, params);

      const discountsResult = await pool.query(`
        SELECT COALESCE(SUM(d.amount), 0) + COALESCE(SUM(c.discount_amount), 0) AS total_discounts
        FROM discounts d
        FULL OUTER JOIN coupons c ON d.business_id = c.business_id
        ${whereBusiness ? 'WHERE ' + whereBusiness.replace('business_id', 'd.business_id') + ' OR ' + whereBusiness.replace('business_id', 'c.business_id') : ''}
      `, business_id ? [business_id] : []);
      const discounts = Number(discountsResult.rows[0]?.total_discounts || 0);
   
      const taxesResult = await pool.query(`
        SELECT COALESCE(SUM(rate), 0) AS total_tax_rate
        FROM taxes
        ${whereBusiness ? 'WHERE ' + whereBusiness : ''}
      `, business_id ? [business_id] : []);
      const taxes = Number(taxesResult.rows[0]?.total_tax_rate || 0);
    
      const staffSalaryResult = await pool.query(
        `SELECT COALESCE(SUM(salary), 0) AS total_staff_salary_paid FROM staff WHERE payment_status = 'paid'${whereClause ? ' AND ' + whereClause : ''}`,
        params
      );
      const totalStaffSalaryPaid = Number(staffSalaryResult.rows[0]?.total_staff_salary_paid || 0);

  
      const productsCountResult = await pool.query(
        `SELECT COUNT(*) FROM products${whereClause ? ' WHERE ' + whereClause : ''}`,
        params
      );
      const variantsCountResult = await pool.query(
        `SELECT COUNT(*) FROM variants v JOIN products p ON v.product_id = p.id${whereClause ? ' WHERE p.' + whereClause : ''}`,
        params
      );
      const variantsInStockResult = await pool.query(
        `SELECT COUNT(*) FROM variants v JOIN products p ON v.product_id = p.id WHERE v.quantity > 0${whereClause ? ' AND p.' + whereClause : ''}`,
        params
      );

      const staffCountResult = await pool.query(
        `SELECT COUNT(*) FROM staff${whereClause ? ' WHERE ' + whereClause : ''}`,
        params
      );
      const customersCountResult = await pool.query(
        `SELECT COUNT(*) FROM customers${whereClause ? ' WHERE ' + whereClause : ''}`,
        params
      );
      const servicesCountResult = await pool.query(
        `SELECT COUNT(*) FROM services${whereClause ? ' WHERE ' + whereClause : ''}`,
        params
      );
    
      const today = new Date().toISOString().slice(0, 10);
      const staffWithShiftTodayResult = await pool.query(
        `SELECT COUNT(DISTINCT staff_id) FROM staff_shifts WHERE work_days LIKE $1${whereClause ? ' AND ' + whereClause : ''}`,
        ['%' + today + '%', ...params]
      );

      const stockMovementResult = await pool.query(
        `SELECT COUNT(*) as movement_count, COALESCE(SUM(quantity),0) as total_qty FROM inventory_logs${whereClause ? ' WHERE ' + whereClause.replace(/business_id|branch_id/g, m => 'variant_id IN (SELECT v.id FROM variants v JOIN products p ON v.product_id = p.id WHERE p.' + m + ' = $' + (params.indexOf(business_id) + 1) + ')') : ''}`,
        params
      );
   
      const topStockMovementResult = await pool.query(
        `SELECT variant_id, SUM(quantity) as total_moved FROM inventory_logs${whereClause ? ' WHERE ' + whereClause.replace(/business_id|branch_id/g, m => 'variant_id IN (SELECT v.id FROM variants v JOIN products p ON v.product_id = p.id WHERE p.' + m + ' = $' + (params.indexOf(business_id) + 1) + ')') : ''} GROUP BY variant_id ORDER BY total_moved DESC LIMIT 1`,
        params
      );
      
      const topExpenseCategoryResult = await pool.query(
        `SELECT ec.name, SUM(e.amount) as total_expense FROM expenses e JOIN expense_categories ec ON e.category_id = ec.id WHERE e.status = 'approved'${whereClause ? ' AND e.' + whereClause : ''} GROUP BY ec.name ORDER BY total_expense DESC LIMIT 1`,
        params
      );

      const topBudgetCategoryResult = await pool.query(
        `SELECT ec.name, SUM(b.amount) as total_budget FROM budgets b JOIN expense_categories ec ON b.category_id = ec.id${whereClause ? ' WHERE b.' + whereClause : ''} GROUP BY ec.name ORDER BY total_budget DESC LIMIT 1`,
        params
      );

      const serviceTrackingResult = await pool.query(
        `SELECT s.name, COUNT(a.id) as usage_count, COALESCE(SUM(s.price),0) as total_revenue FROM appointments a JOIN services s ON a.service_id = s.id${whereClause ? ' WHERE a.' + whereClause : ''} GROUP BY s.name ORDER BY usage_count DESC`,
        params
      );

      res.json({
        salesByCategory: salesByCategoryResult.rows,
        expenseByCategory: expenseByCategoryResult.rows,
        budgetByCategory: budgetByCategoryResult.rows,
        grossIncome,
        netIncome,
        topProducts: topProductsResult.rows,
        discounts,
        taxes,
        totalStaffSalaryPaid,
        productsCount: Number(productsCountResult.rows[0]?.count || 0),
        variantsCount: Number(variantsCountResult.rows[0]?.count || 0),
        variantsInStock: Number(variantsInStockResult.rows[0]?.count || 0),
        staffCount: Number(staffCountResult.rows[0]?.count || 0),
        customersCount: Number(customersCountResult.rows[0]?.count || 0),
        servicesCount: Number(servicesCountResult.rows[0]?.count || 0),
        staffWithShiftToday: Number(staffWithShiftTodayResult.rows[0]?.count || 0),
        stockMovement: stockMovementResult.rows[0],
        topStockMovement: topStockMovementResult.rows[0],
        topExpenseCategory: topExpenseCategoryResult.rows[0],
        topBudgetCategory: topBudgetCategoryResult.rows[0],
        serviceTracking: serviceTrackingResult.rows
      });
    } catch (err) {
      console.error('Analytics overview error:', err);
      res.status(500).json({ message: 'Failed to fetch analytics overview.' });
    }
  },
};
