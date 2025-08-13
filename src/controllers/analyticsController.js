const pool = require('../config/db');

  exports.overview = async (req, res) => {
    try {
      const business_id = req.query.business_id || req.user?.business_id;
      const branch_id = req.query.branch_id;
      const date_filter = req.query.date_filter;
      const start_date = req.query.start_date;
      const end_date = req.query.end_date;
     
      let dateWhere = '';
      if (date_filter) {
        if (date_filter === 'today') {
          dateWhere = ` AND o.created_at::date = CURRENT_DATE`;
        } else if (date_filter === 'yesterday') {
          dateWhere = ` AND o.created_at::date = CURRENT_DATE - INTERVAL '1 day'`;
        } else if (date_filter === 'this_week') {
          dateWhere = ` AND o.created_at >= date_trunc('week', CURRENT_DATE)`;
        } else if (date_filter === 'last_7_days') {
          dateWhere = ` AND o.created_at >= CURRENT_DATE - INTERVAL '7 days'`;
        } else if (date_filter === 'this_month') {
          dateWhere = ` AND o.created_at >= date_trunc('month', CURRENT_DATE)`;
        } else if (date_filter === 'this_year') {
          dateWhere = ` AND o.created_at >= date_trunc('year', CURRENT_DATE)`;
        } else if (date_filter === 'custom' && start_date && end_date) {
          dateWhere = ` AND o.created_at::date BETWEEN '${start_date}' AND '${end_date}'`;
        }
      }
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
     
      const expenseByCategoryResult = await pool.query(`
        SELECT ec.name AS category, SUM(e.amount) AS total_expense
        FROM expenses e
        JOIN expense_categories ec ON e.category_id = ec.id
        WHERE e.status = 'approved'${whereClause ? ' AND e.' + whereClause : ''}
        GROUP BY ec.name
        ORDER BY total_expense DESC
      `, params);
    
      const budgetByCategoryResult = await pool.query(`
        SELECT ec.name AS category, SUM(b.amount) AS total_budget
        FROM budgets b
        JOIN expense_categories ec ON b.category_id = ec.id
        ${whereClause ? 'WHERE b.' + whereClause : ''}
        GROUP BY ec.name
        ORDER BY total_budget DESC
      `, params);
     
      const grossIncomeResult = await pool.query(
        `SELECT SUM(total_amount) AS gross_income FROM orders o WHERE status = 'completed'${whereClause ? ' AND ' + whereClause : ''}${dateWhere}`,
        params
      );
      
      const cogsResult = await pool.query(
        `SELECT COALESCE(SUM(v.cost_price * oi.quantity), 0) AS cogs
         FROM order_items oi
         JOIN variants v ON oi.variant_id = v.id
         JOIN products p ON v.product_id = p.id
         JOIN orders o ON oi.order_id = o.id
         WHERE o.status = 'completed'${whereClause ? ' AND p.' + whereClause : ''}${dateWhere}`,
        params
      );
      const grossIncome = Number(grossIncomeResult.rows[0]?.gross_income || 0);
      const cogs = Number(cogsResult.rows[0]?.cogs || 0);
      const totalExpenseResult = await pool.query(
        `SELECT SUM(amount) AS total_expense FROM expenses WHERE status = 'approved'${whereClause ? ' AND ' + whereClause : ''}`,
        params
      );
      const totalExpense = Number(totalExpenseResult.rows[0]?.total_expense || 0);
     
      const netIncome = grossIncome - cogs - totalExpense;
   
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
    
    
      const staffSalaryExpenseResult = await pool.query(
        `SELECT COALESCE(SUM(e.amount), 0) AS total_staff_salary_paid
         FROM expenses e
         JOIN expense_categories ec ON e.category_id = ec.id
         WHERE e.status = 'approved' AND (LOWER(ec.name) = 'salary' OR e.staff_id IS NOT NULL)${whereClause ? ' AND e.' + whereClause : ''}`,
        params
      );
      const totalStaffSalaryPaid = Number(staffSalaryExpenseResult.rows[0]?.total_staff_salary_paid || 0);

  
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
        cogs,
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
  };

  exports.variationAnalytics = async (req, res) => {
    try {
      const business_id = req.query.business_id;
      const branch_id = req.query.branch_id;
      const date_filter = req.query.date_filter;
      const start_date = req.query.start_date;
      const end_date = req.query.end_date;
      let params = [];
      let wheres = [];
      let idx = 1;
      if (business_id) {
        wheres.push(`p.business_id = $${idx}`);
        params.push(business_id);
        idx++;
      }
      if (branch_id) {
        wheres.push(`p.branch_id = $${idx}`);
        params.push(branch_id);
        idx++;
      }
      let whereClause = wheres.length > 0 ? 'WHERE ' + wheres.join(' AND ') : '';
      
      let dateWhere = '';
      if (date_filter) {
        if (date_filter === 'today') {
          dateWhere = ` AND o.created_at::date = CURRENT_DATE`;
        } else if (date_filter === 'yesterday') {
          dateWhere = ` AND o.created_at::date = CURRENT_DATE - INTERVAL '1 day'`;
        } else if (date_filter === 'this_week') {
          dateWhere = ` AND o.created_at >= date_trunc('week', CURRENT_DATE)`;
        } else if (date_filter === 'last_7_days') {
          dateWhere = ` AND o.created_at >= CURRENT_DATE - INTERVAL '7 days'`;
        } else if (date_filter === 'this_month') {
          dateWhere = ` AND o.created_at >= date_trunc('month', CURRENT_DATE)`;
        } else if (date_filter === 'this_year') {
          dateWhere = ` AND o.created_at >= date_trunc('year', CURRENT_DATE)`;
        } else if (date_filter === 'custom' && start_date && end_date) {
          dateWhere = ` AND o.created_at::date BETWEEN '${start_date}' AND '${end_date}'`;
        }
      }
     
      const inventoryValueResult = await pool.query(
        `SELECT COALESCE(SUM(v.cost_price * v.quantity), 0) AS inventory_value
         FROM variants v JOIN products p ON v.product_id = p.id
         ${whereClause}`,
        params
      );
      
      const potentialSaleValueResult = await pool.query(
        `SELECT COALESCE(SUM(v.selling_price * v.quantity), 0) AS potential_sale_value
         FROM variants v JOIN products p ON v.product_id = p.id
         ${whereClause}`,
        params
      );
      
      const cogsResult = await pool.query(
        `SELECT COALESCE(SUM(v.cost_price * oi.quantity), 0) AS cogs
         FROM order_items oi
         JOIN variants v ON oi.variant_id = v.id
         JOIN products p ON v.product_id = p.id
         JOIN orders o ON oi.order_id = o.id
         WHERE o.status = 'completed'${wheres.length > 0 ? ' AND ' + wheres.map((w, i) => 'p.' + w.split('=')[0] + ' = $' + (i + 1)).join(' AND ') : ''}${dateWhere}`,
        params
      );
      res.json({
        inventory_value: Number(inventoryValueResult.rows[0]?.inventory_value || 0),
        potential_sale_value: Number(potentialSaleValueResult.rows[0]?.potential_sale_value || 0),
        cogs: Number(cogsResult.rows[0]?.cogs || 0)
      });
    } catch (err) {
      console.error('Variation analytics error:', err);
      res.status(500).json({ message: 'Failed to fetch variation analytics.' });
    }
  };

  exports.productAnalytics = async (req, res) => {
    try {
      const { business_id, branch_id, date_filter, start_date, end_date } = req.query;
      let params = [];
      let wheres = [];
      let idx = 1;
      if (business_id) { wheres.push(`p.business_id = $${idx}`); params.push(business_id); idx++; }
      if (branch_id) { wheres.push(`p.branch_id = $${idx}`); params.push(branch_id); idx++; }
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
      
      const topProductsResult = await pool.query(
        `SELECT p.id, p.name, SUM(oi.quantity) AS units_sold, SUM(oi.total_price) AS total_sales
         FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         JOIN variants v ON oi.variant_id = v.id
         JOIN products p ON v.product_id = p.id
         WHERE o.status = 'completed'${wheres.length > 0 ? ' AND ' + wheres.map((w, i) => 'p.' + w.split('=')[0] + ' = $' + (i + 1)).join(' AND ') : ''}${dateWhere}
         GROUP BY p.id, p.name
         ORDER BY total_sales DESC
         LIMIT 10`,
        params
      );
      res.json({ topProducts: topProductsResult.rows });
    } catch (err) {
      console.error('Product analytics error:', err);
      res.status(500).json({ message: 'Failed to fetch product analytics.' });
    }
  };

  exports.stockAnalytics = async (req, res) => {
    try {
      const { business_id, branch_id } = req.query;
      let params = [];
      let wheres = [];
      let idx = 1;
      if (business_id) { wheres.push(`p.business_id = $${idx}`); params.push(business_id); idx++; }
      if (branch_id) { wheres.push(`p.branch_id = $${idx}`); params.push(branch_id); idx++; }
      let whereClause = wheres.length > 0 ? 'WHERE ' + wheres.join(' AND ') : '';
     
      const totalStockResult = await pool.query(
        `SELECT COALESCE(SUM(v.quantity),0) AS total_stock FROM variants v JOIN products p ON v.product_id = p.id ${whereClause}`,
        params
      );
      
      const outOfStockResult = await pool.query(
        `SELECT COUNT(*) AS out_of_stock FROM variants v JOIN products p ON v.product_id = p.id WHERE v.quantity = 0${wheres.length > 0 ? ' AND ' + wheres.map((w, i) => 'p.' + w.split('=')[0] + ' = $' + (i + 1)).join(' AND ') : ''}`,
        params
      );
     
      const lowStockResult = await pool.query(
        `SELECT COUNT(*) AS low_stock FROM variants v JOIN products p ON v.product_id = p.id WHERE v.quantity <= v.threshold AND v.quantity > 0${wheres.length > 0 ? ' AND ' + wheres.map((w, i) => 'p.' + w.split('=')[0] + ' = $' + (i + 1)).join(' AND ') : ''}`,
        params
      );
      res.json({
        totalStock: Number(totalStockResult.rows[0]?.total_stock || 0),
        outOfStock: Number(outOfStockResult.rows[0]?.out_of_stock || 0),
        lowStock: Number(lowStockResult.rows[0]?.low_stock || 0)
      });
    } catch (err) {
      console.error('Stock analytics error:', err);
      res.status(500).json({ message: 'Failed to fetch stock analytics.' });
    }
  };

  exports.salesAnalytics = async (req, res) => {
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
    
      const salesResult = await pool.query(
        `SELECT COUNT(*) AS total_orders, COALESCE(SUM(total_amount),0) AS total_sales FROM orders ${whereClause} AND status = 'completed'${dateWhere}`,
        params
      );
      res.json({
        totalOrders: Number(salesResult.rows[0]?.total_orders || 0),
        totalSales: Number(salesResult.rows[0]?.total_sales || 0)
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
      let params = [];
      let wheres = [];
      let idx = 1;
      if (business_id) { wheres.push(`p.business_id = $${idx}`); params.push(business_id); idx++; }
      if (branch_id) { wheres.push(`p.branch_id = $${idx}`); params.push(branch_id); idx++; }
      if (variant_id) { wheres.push(`v.id = $${idx}`); params.push(variant_id); idx++; }
      if (product_id) { wheres.push(`p.id = $${idx}`); params.push(product_id); idx++; }
      let whereClause = wheres.length > 0 ? 'WHERE ' + wheres.join(' AND ') : '';
      let dateGroup = 'day';
      let dateSelect = `DATE(il.created_at)`;
      if (period === 'hour') { dateGroup = 'hour'; dateSelect = `DATE_TRUNC('hour', il.created_at)`; }
      else if (period === 'day') { dateGroup = 'day'; dateSelect = `DATE(il.created_at)`; }
      else if (period === 'week') { dateGroup = 'week'; dateSelect = `DATE_TRUNC('week', il.created_at)`; }
      else if (period === 'month') { dateGroup = 'month'; dateSelect = `DATE_TRUNC('month', il.created_at)`; }
      else if (period === 'year') { dateGroup = 'year'; dateSelect = `DATE_TRUNC('year', il.created_at)`; }
      let dateWhere = '';
      if (start_date && end_date) {
        dateWhere = ` AND il.created_at::date BETWEEN '${start_date}' AND '${end_date}'`;
      }

      const movementResult = await pool.query(
        `SELECT ${dateSelect} AS period, SUM(il.quantity) AS total_moved, COUNT(*) AS movement_count, MIN(il.created_at) AS first_movement, MAX(il.created_at) AS last_movement
         FROM inventory_logs il
         JOIN variants v ON il.variant_id = v.id
         JOIN products p ON v.product_id = p.id
         ${whereClause}${dateWhere}
         GROUP BY period
         ORDER BY period ASC`,
        params
      );
      res.json({ movements: movementResult.rows });
    } catch (err) {
      console.error('Stock movement analytics error:', err);
      res.status(500).json({ message: 'Failed to fetch stock movement analytics.' });
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

  exports.salesReport = async (req, res) => {
    try {
      const { business_id, branch_id, period = 'day', start_date, end_date, summary = 'true', details = 'false', payment_methods = 'false', product_breakdown = 'false', page = 1, pageSize = 20 } = req.query;
      if (!business_id) return res.status(400).json({ error: 'business_id is required' });
      if (!['day', 'month', 'year', 'custom'].includes(period)) return res.status(400).json({ error: 'Invalid period parameter' });
      if (period === 'custom' && (!start_date || !end_date)) return res.status(400).json({ error: 'start_date and end_date required for custom period' });
      const pageInt = parseInt(page);
      const pageSizeInt = parseInt(pageSize);
      if (isNaN(pageInt) || isNaN(pageSizeInt) || pageInt < 1 || pageSizeInt < 1) return res.status(400).json({ error: 'Invalid pagination parameters' });
      let dateWhere = '';
      if (period === 'day') dateWhere = ` AND DATE(o.created_at) = CURRENT_DATE`;
      else if (period === 'month') dateWhere = ` AND DATE_TRUNC('month', o.created_at) = DATE_TRUNC('month', CURRENT_DATE)`;
      else if (period === 'year') dateWhere = ` AND DATE_TRUNC('year', o.created_at) = DATE_TRUNC('year', CURRENT_DATE)`;
      else if (period === 'custom') dateWhere = ` AND o.created_at::date BETWEEN '${start_date}' AND '${end_date}'`;

      
      let where = `o.status = 'completed' AND o.business_id = $1`;
      let params = [business_id];
      let paramIdx = 2;
      if (branch_id) {
        where += ` AND o.branch_id = $${paramIdx}`;
        params.push(branch_id);
        paramIdx++;
      }
      where += dateWhere;

      let summaryData = {};
      if (summary === 'true') {
        const summaryResult = await pool.query(
          `SELECT COUNT(*) as total_orders, COALESCE(SUM(oi.quantity * oi.selling_price),0) as total_sales, COALESCE(SUM(o.tax),0) as total_tax, COALESCE(SUM(o.discount),0) as total_discount
           FROM orders o
           JOIN order_items oi ON o.id = oi.order_id
           WHERE ${where}`,
          params
        );
        summaryData = summaryResult.rows[0];
        const cogsResult = await pool.query(
          `SELECT COALESCE(SUM(oi.quantity * oi.cost_price),0) as total_cogs
           FROM orders o
           JOIN order_items oi ON o.id = oi.order_id
           WHERE ${where}`,
          params
        );
        summaryData.total_cogs = Number(cogsResult.rows[0]?.total_cogs || 0);
        summaryData.gross_profit = (Number(summaryData.total_sales) || 0) - summaryData.total_cogs;
      }

      let orderDetails = [];
      if (details === 'true') {
        const offset = (pageInt - 1) * pageSizeInt;
       
        const detailsParams = [...params, pageSizeInt, offset];
        const detailsResult = await pool.query(
          `SELECT o.id as order_id, o.customer_name, o.order_method, o.total_amount, o.tax, o.discount, o.payment_method, o.created_at, o.status, oi.variant_id, oi.product_name, oi.quantity, oi.selling_price, oi.cost_price
           FROM orders o
           JOIN order_items oi ON o.id = oi.order_id
           WHERE ${where}
           ORDER BY o.created_at DESC
           LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
          detailsParams
        );
        orderDetails = detailsResult.rows;
      }

      let paymentStats = [];
      if (payment_methods === 'true') {
        const payResult = await pool.query(
          `SELECT o.payment_method, COUNT(*) as count, COALESCE(SUM(o.total_amount),0) as total
           FROM orders o
           WHERE ${where}
           GROUP BY o.payment_method`,
          params
        );
        paymentStats = payResult.rows;
      }

      let productStats = [];
      if (product_breakdown === 'true') {
        const prodResult = await pool.query(
          `SELECT oi.product_id, oi.product_name, oi.variant_id, SUM(oi.quantity) as total_qty, SUM(oi.quantity * oi.selling_price) as total_sales
           FROM order_items oi
           JOIN orders o ON oi.order_id = o.id
           WHERE ${where}
           GROUP BY oi.product_id, oi.product_name, oi.variant_id
           ORDER BY total_sales DESC`,
          params
        );
        productStats = prodResult.rows;
      }
      res.json({
        period,
        ...(period === 'custom' && { start_date, end_date }),
        summary: summaryData,
        order_details: orderDetails,
        payment_methods: paymentStats,
        product_breakdown: productStats,
        ...(details === 'true' && {
          pagination: {
            page: pageInt,
            pageSize: pageSizeInt,
            total: orderDetails.length
          }
        })
      });
    } catch (err) {
      console.error('Sales report error:', err);
      res.status(500).json({ error: 'Failed to generate sales report', details: err.message });
    }
  };

