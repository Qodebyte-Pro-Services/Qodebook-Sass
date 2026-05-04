const pool = require('../config/db');
const StockNotificationService = require('../services/stockNotificationService');



exports.createSale = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      business_id, branch_id, staff_id, created_by_user_id,
      customer_id, items, discount = 0, coupon = 0, taxes = 0,
      note, order_type, payments,
      sale_type = 'regular', installment_plan, credit_details
    } = req.body;


    if (!business_id || !branch_id || !Array.isArray(items) || items.length === 0)
      return res.status(400).json({ message: "Missing required fields." });
    if (!staff_id && !created_by_user_id)
      return res.status(400).json({ message: "Sale must be recorded by staff or user." });
    if (!Array.isArray(payments) || payments.length === 0)
      return res.status(400).json({ message: "At least one payment is required." });

    await client.query("BEGIN");

    
    let customerId = customer_id || null;
    if (customerId === 0) {
      const existing = await client.query(
        "SELECT id FROM customers WHERE business_id = $1 AND id = 0 LIMIT 1",
        [business_id]
      );
      if (existing.rows.length === 0) {
        await client.query(
          "INSERT INTO customers (id, business_id, name) VALUES (0, $1, 'Walk-in')",
          [business_id]
        );
      }
      customerId = 0;
    } else if (!customerId && req.body.customer) {
      const { name, phone, email } = req.body.customer;
      const custRes = await client.query(
        "INSERT INTO customers (business_id, name, phone, email) VALUES ($1,$2,$3,$4) RETURNING id",
        [business_id, name, phone, email]
      );
      customerId = custRes.rows[0].id;
    }

   
    let subtotal = 0, tax_total = Number(taxes),
        discount_total = Number(discount), coupon_total = Number(coupon);

    for (const item of items) {
      subtotal += Number(item.total_price || 0);
      if (Array.isArray(item.taxes))     tax_total      += item.taxes.reduce((s, t) => s + (t.amount || 0), 0);
      if (Array.isArray(item.discounts)) discount_total += item.discounts.reduce((s, d) => s + (d.amount || 0), 0);
      if (Array.isArray(item.coupons))   coupon_total   += item.coupons.reduce((s, c) => s + (c.amount || 0), 0);
    }

    const total_amount = subtotal + tax_total - discount_total - coupon_total;
    const paymentTotal = payments.reduce((s, p) => s + Number(p.amount || 0), 0);

    if (sale_type === 'regular' && paymentTotal !== total_amount) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Payment total must equal order total." });
    }
    if (sale_type === 'installment' && (!installment_plan || paymentTotal !== Number(installment_plan.down_payment || 0))) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "For installment, initial payment must equal down payment." });
    }
    if (sale_type === 'credit' && (!credit_details || paymentTotal !== Number(credit_details.amount_paid || 0))) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "For credit, initial payment must equal amount paid." });
    }

  
    const orderRes = await client.query(
      `INSERT INTO orders (
        business_id, branch_id, customer_id, subtotal, tax_total,
        discount_total, coupon_total, total_amount, status, order_type,
        staff_id, created_by_user_id, note
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [
        business_id, branch_id, customerId, subtotal, tax_total,
        discount_total, coupon_total, total_amount,
        sale_type === 'installment' ? 'pending' : 'completed',
        order_type || "walk_in", staff_id || null, created_by_user_id || null, note || null
      ]
    );
    const order = orderRes.rows[0];

 
    await client.query(
      `INSERT INTO order_payments (order_id, method, amount, reference)
       SELECT $1, unnest($2::text[]), unnest($3::numeric[]), unnest($4::text[])`,
      [
        order.id,
        payments.map(p => p.method),
        payments.map(p => p.amount),
        payments.map(p => p.reference || null)
      ]
    );


    if (sale_type === 'installment') {
      const planRes = await client.query(
        `INSERT INTO installment_plans (
          order_id, business_id, customer_id, total_amount, down_payment,
          remaining_balance, number_of_payments, payment_frequency, start_date, notes
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
        [
          order.id, business_id, customerId, total_amount,
          installment_plan.down_payment, installment_plan.remaining_balance,
          installment_plan.number_of_payments, installment_plan.payment_frequency,
          installment_plan.start_date, installment_plan.notes || null
        ]
      );
      const planId = planRes.rows[0].id;
      const numPayments = Number(installment_plan.number_of_payments);
      const installmentAmount = Number((Number(installment_plan.remaining_balance) / numPayments).toFixed(2));

      const getDueDate = (i) => {
        const d = new Date(installment_plan.start_date);
        if (installment_plan.payment_frequency === 'daily')   d.setDate(d.getDate() + i);
        if (installment_plan.payment_frequency === 'weekly')  d.setDate(d.getDate() + i * 7);
        if (installment_plan.payment_frequency === 'monthly') d.setMonth(d.getMonth() + i);
        return d;
      };

      const ipPlanIds     = Array(numPayments + 1).fill(planId);
      const ipNumbers     = [0, ...Array.from({ length: numPayments }, (_, i) => i + 1)];
      const ipAmounts     = [installment_plan.down_payment, ...Array(numPayments).fill(installmentAmount)];
      const ipDueDates    = [new Date(), ...Array.from({ length: numPayments }, (_, i) => getDueDate(i + 1))];
      const ipPaidDates   = [new Date(), ...Array(numPayments).fill(null)];
      const ipStatuses    = ['paid', ...Array(numPayments).fill('pending')];
      const ipMethods     = [payments[0]?.method || 'cash', ...Array(numPayments).fill(null)];
      const ipTypes       = ['down_payment', ...Array(numPayments).fill('installment')];

     await client.query(
  `INSERT INTO installment_payments
     (installment_plan_id, payment_number, amount, due_date, paid_at, status, method, type)
   SELECT
     unnest($1::int[]),
     unnest($2::int[]),
     unnest($3::numeric[]),
     unnest($4::timestamptz[]),
     unnest($5::timestamptz[]),
     unnest($6::installment_payment_status[]),
     unnest($7::installment_payment_method[]),  
     unnest($8::installment_payment_type[])   
  `,
  [ipPlanIds, ipNumbers, ipAmounts, ipDueDates, ipPaidDates, ipStatuses, ipMethods, ipTypes]
);

    } else if (sale_type === 'credit') {
      await client.query(
        `INSERT INTO credit_accounts (
          order_id, business_id, customer_id, total_amount, amount_paid,
          balance, credit_type, issued_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          order.id, business_id, customerId, total_amount,
          credit_details.amount_paid || 0, credit_details.balance,
          credit_details.credit_type, new Date()
        ]
      );
    }

  
    await client.query(
      `INSERT INTO order_items (order_id, variant_id, quantity, unit_price, total_price)
       SELECT $1, unnest($2::int[]), unnest($3::numeric[]), unnest($4::numeric[]), unnest($5::numeric[])`,
      [
        order.id,
        items.map(i => i.variant_id),
        items.map(i => Number(i.quantity)),
        items.map(i => i.unit_price),
        items.map(i => i.total_price)
      ]
    );

 
    const grouped = new Map();
    for (const item of items) {
      const prev = grouped.get(item.variant_id) || 0;
      grouped.set(item.variant_id, prev + Number(item.quantity));
    }
    const groupedVariantIds = [...grouped.keys()];
    const groupedQuantities = [...grouped.values()];

    if (groupedVariantIds.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "No valid items." });
    }

    const recorded_by      = staff_id ? String(staff_id) : String(created_by_user_id);
    const recorded_by_type = staff_id ? "staff" : "user";

  
    if (sale_type !== 'installment') {
      const variantsRes = await client.query(
        `SELECT id, quantity FROM variants
         WHERE id = ANY($1::int[]) FOR UPDATE`,
        [groupedVariantIds]
      );

      if (variantsRes.rows.length !== groupedVariantIds.length) {
        const found = new Set(variantsRes.rows.map(v => v.id));
        const missing = groupedVariantIds.find(id => !found.has(id));
        await client.query("ROLLBACK");
        return res.status(400).json({ message: `Variant ${missing} not found` });
      }

      const variantMap = new Map(
        variantsRes.rows.map(v => [v.id, Number(v.quantity)])
      );

      const newQuantities = groupedVariantIds.map(id => {
        const newQty = (variantMap.get(id) || 0) - grouped.get(id);
        if (newQty < 0) {
          throw new Error(`Insufficient stock for variant ${id}`);
        }
        return newQty;
      });

      await client.query(
        `UPDATE variants
            SET quantity = v.new_qty
           FROM (
             SELECT unnest($1::int[]) AS id, unnest($2::numeric[]) AS new_qty
           ) AS v
          WHERE variants.id = v.id`,
        [groupedVariantIds, newQuantities]
      );

      await client.query(
        `INSERT INTO inventory_logs
           (variant_id, type, quantity, reason, note, business_id, branch_id, recorded_by, recorded_by_type)
         SELECT
           unnest($1::int[]), 'sale', unnest($2::numeric[]),
           'decrease', $3, $4, $5, $6, $7`,
        [groupedVariantIds, groupedQuantities, note || "POS Sale transaction", business_id, branch_id, recorded_by, recorded_by_type]
      );
    }

    
    const taxRows      = items.flatMap(i => (i.taxes     || []).map(t => [i.variant_id, t.id]));
    const discountRows = items.flatMap(i => (i.discounts || []).map(d => [i.variant_id, d.id]));
    const couponRows   = items.flatMap(i => (i.coupons   || []).map(c => [i.variant_id, c.id]));

    if (taxRows.length > 0) {
      await client.query(
        `INSERT INTO product_taxes (product_id, tax_id)
         SELECT unnest($1::int[]), unnest($2::int[])
         ON CONFLICT DO NOTHING`,
        [taxRows.map(r => r[0]), taxRows.map(r => r[1])]
      );
    }
    if (discountRows.length > 0) {
      await client.query(
        `INSERT INTO product_discounts (product_id, discount_id)
         SELECT unnest($1::int[]), unnest($2::int[])
         ON CONFLICT DO NOTHING`,
        [discountRows.map(r => r[0]), discountRows.map(r => r[1])]
      );
    }
    if (couponRows.length > 0) {
      await client.query(
        `INSERT INTO product_coupons (product_id, coupon_id)
         SELECT unnest($1::int[]), unnest($2::int[])
         ON CONFLICT DO NOTHING`,
        [couponRows.map(r => r[0]), couponRows.map(r => r[1])]
      );
    }

    await client.query("COMMIT");

  
    if (sale_type !== 'installment') {
      Promise.allSettled(
        groupedVariantIds.flatMap(id => [
          StockNotificationService.checkLowStock(id, business_id),
          StockNotificationService.checkOutOfStock(id, business_id),
        ])
      ).then(results => {
        results.forEach(r => {
          if (r.status === 'rejected') console.error('Stock notification failed:', r.reason?.message);
        });
      });
    }

    const [saleRes, itemsRes, paymentsRes] = await Promise.all([
      pool.query(
        `SELECT o.*, 
          c.name AS customer_name, c.phone AS customer_phone, c.email AS customer_email,
          b.branch_name,
          COALESCE(s.full_name, CONCAT(u.first_name, ' ', u.last_name), '') AS recorded_by_name
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN branches b ON o.branch_id = b.id
        LEFT JOIN staff s ON o.staff_id = s.staff_id
        LEFT JOIN users u ON o.created_by_user_id = u.id
        WHERE o.id = $1`,
        [order.id]
      ),
      pool.query(
        `SELECT oi.*, v.sku AS variant_name, v.attributes, v.selling_price
         FROM order_items oi
         LEFT JOIN variants v ON oi.variant_id = v.id
         WHERE oi.order_id = $1`,
        [order.id]
      ),
      pool.query(`SELECT * FROM order_payments WHERE order_id = $1`, [order.id])
    ]);

    return res.status(201).json({
      sale: saleRes.rows[0],
      items: itemsRes.rows,
      payments: paymentsRes.rows
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ createSale error:", err);
    return res.status(500).json({ message: err.message || "Server error." });
  } finally {
    client.release();
  }
};




exports.listSales = async (req, res) => {
  try {
    const { business_id, branch_id } = req.query;
    let whereClauses = [`o.status = 'completed'`];
    let params = [];
    let idx = 1;

    if (business_id) {
      whereClauses.push(`o.business_id = $${idx}`);
      params.push(business_id);
      idx++;
    }

    if (branch_id) {
      whereClauses.push(`o.branch_id = $${idx}`);
      params.push(branch_id);
      idx++;
    }

    const query = `
      SELECT 
        o.*,
        c.name AS customer_name, 
        c.phone AS customer_phone, 
        c.email AS customer_email,
        b.branch_name AS branch_name,
        COALESCE(s.full_name, CONCAT(u.first_name, ' ', u.last_name), '') AS recorded_by_name,

        -- compute totals
        COALESCE(SUM(op.amount), 0) AS total_paid,
        (o.subtotal + o.tax_total - o.discount_total - o.coupon_total) AS total_due,
        ((o.subtotal + o.tax_total - o.discount_total - o.coupon_total) - COALESCE(SUM(op.amount), 0)) AS balance,

        -- aggregate payment details
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', op.id,
              'method', op.method,
              'amount', op.amount,
              'reference', op.reference,
              'paid_at', op.paid_at
            )
          ) FILTER (WHERE op.id IS NOT NULL),
          '[]'
        ) AS payments

      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN branches b ON o.branch_id = b.id
      LEFT JOIN staff s ON o.staff_id = s.staff_id
      LEFT JOIN users u ON o.created_by_user_id = u.id
      LEFT JOIN order_payments op ON o.id = op.order_id

      WHERE ${whereClauses.join(' AND ')}

      GROUP BY 
        o.id, c.name, c.phone, c.email, b.branch_name, s.full_name, u.first_name, u.last_name
      ORDER BY o.created_at DESC
    `;

    const result = await pool.query(query, params);

    return res.status(200).json({ sales: result.rows });
  } catch (err) {
    console.error('❌ Error listing sales:');
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.listStaffSalesAndKpi = async (req, res) => {
  try {
    const staff_id = req.user.staff_id;
    
    if (!staff_id) {
      return res.status(400).json({ message: "Staff ID not found in token." });
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const query = `
      SELECT 
        o.*,
        c.name AS customer_name, 
        c.phone AS customer_phone, 
        c.email AS customer_email,
        b.branch_name AS branch_name,
        COALESCE(s.full_name, CONCAT(u.first_name, ' ', u.last_name), '') AS recorded_by_name,

        -- compute totals
        COALESCE(SUM(op.amount), 0) AS total_paid,
        (o.subtotal + o.tax_total - o.discount_total - o.coupon_total) AS total_due,
        ((o.subtotal + o.tax_total - o.discount_total - o.coupon_total) - COALESCE(SUM(op.amount), 0)) AS balance,

        -- aggregate payment details
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', op.id,
              'method', op.method,
              'amount', op.amount,
              'reference', op.reference,
              'paid_at', op.paid_at
            )
          ) FILTER (WHERE op.id IS NOT NULL),
          '[]'
        ) AS payments

      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN branches b ON o.branch_id = b.id
      LEFT JOIN staff s ON o.staff_id = s.staff_id
      LEFT JOIN users u ON o.created_by_user_id = u.id
      LEFT JOIN order_payments op ON o.id = op.order_id

      WHERE o.status = 'completed' 
        AND o.staff_id = $1
        AND o.created_at >= $2 
        AND o.created_at < $3

      GROUP BY 
        o.id, c.name, c.phone, c.email, b.branch_name, s.full_name, u.first_name, u.last_name
      ORDER BY o.created_at DESC
    `;

    const result = await pool.query(query, [staff_id, today, tomorrow]);
    const sales = result.rows;

   
    const kpis = {
      total_transactions: sales.length,
      total_sales_amount: 0,
      total_discount: 0,
      total_tax: 0,
      order_type_breakdown: {
        walk_in: { count: 0, percentage: 0 },
        online_order: { count: 0, percentage: 0 }
      },
      payment_method_breakdown: {}
    };

   
    sales.forEach(sale => {
      kpis.total_sales_amount += parseFloat(sale.total_amount) || 0;
      kpis.total_discount += parseFloat(sale.discount_total) || 0;
      kpis.total_tax += parseFloat(sale.tax_total) || 0;

     
      const orderType = sale.order_type || 'walk_in';
      if (kpis.order_type_breakdown[orderType] !== undefined) {
        kpis.order_type_breakdown[orderType].count++;
      }

    
      if (Array.isArray(sale.payments) && sale.payments.length > 0) {
        sale.payments.forEach(payment => {
          const method = payment.method || 'unknown';
          if (!kpis.payment_method_breakdown[method]) {
            kpis.payment_method_breakdown[method] = { count: 0, amount: 0 };
          }
          kpis.payment_method_breakdown[method].count++;
          kpis.payment_method_breakdown[method].amount += parseFloat(payment.amount) || 0;
        });
      }
    });

  
    const totalOrders = kpis.total_transactions || 1;
    Object.keys(kpis.order_type_breakdown).forEach(type => {
      kpis.order_type_breakdown[type].percentage = parseFloat(
        ((kpis.order_type_breakdown[type].count / totalOrders) * 100).toFixed(2)
      );
    });

   
    const totalPayments = Object.values(kpis.payment_method_breakdown).reduce((sum, m) => sum + m.count, 0) || 1;
    Object.keys(kpis.payment_method_breakdown).forEach(method => {
      kpis.payment_method_breakdown[method].percentage = parseFloat(
        ((kpis.payment_method_breakdown[method].count / totalPayments) * 100).toFixed(2)
      );
    });

   
    kpis.total_sales_amount = parseFloat(kpis.total_sales_amount.toFixed(2));
    kpis.total_discount = parseFloat(kpis.total_discount.toFixed(2));
    kpis.total_tax = parseFloat(kpis.total_tax.toFixed(2));

    return res.status(200).json({ 
      sales: sales,
      kpis: kpis,
      date: today.toISOString().split('T')[0],
      staff_id: staff_id
    });
  } catch (err) {
    console.error('❌ Error listing staff sales and KPI:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

  exports.getSale = async (req, res) => {
  try {
    const { id } = req.params;

    const saleRes = await pool.query(`
      SELECT 
        o.*,
        c.name AS customer_name, 
        c.phone AS customer_phone, 
        c.email AS customer_email,
        b.branch_name AS branch_name,
        COALESCE(s.full_name, CONCAT(u.first_name, ' ', u.last_name), '') AS recorded_by_name,
        COALESCE(SUM(op.amount), 0) AS total_paid,
        (o.subtotal + o.tax_total - o.discount_total - o.coupon_total) AS total_due,
        ((o.subtotal + o.tax_total - o.discount_total - o.coupon_total) - COALESCE(SUM(op.amount), 0)) AS balance
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN branches b ON o.branch_id = b.id
      LEFT JOIN staff s ON o.staff_id = s.staff_id
      LEFT JOIN users u ON o.created_by_user_id = u.id
      LEFT JOIN order_payments op ON o.id = op.order_id
      WHERE o.id = $1
      GROUP BY 
        o.id, c.name, c.phone, c.email, b.branch_name, s.full_name, u.first_name, u.last_name
    `, [id]);

    if (saleRes.rows.length === 0) {
      return res.status(404).json({ message: 'Sale not found.' });
    }

    const itemsRes = await pool.query(`
      SELECT 
        oi.*, 
        v.sku AS variant_name, 
        v.attributes, 
        v.quantity AS stock_quantity, 
        v.selling_price
      FROM order_items oi
      LEFT JOIN variants v ON oi.variant_id = v.id
      WHERE oi.order_id = $1
    `, [id]);

    const paymentsRes = await pool.query(`
      SELECT 
        id, method, amount, reference, paid_at
      FROM order_payments
      WHERE order_id = $1
      ORDER BY paid_at ASC
    `, [id]);

    return res.status(200).json({
      sale: saleRes.rows[0],
      items: itemsRes.rows,
      payments: paymentsRes.rows
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.refundSale = async (req, res) => {
  try {
    const { id } = req.params;
   
    await pool.query('UPDATE orders SET status = $1 WHERE id = $2', ['canceled', id]);
   
    return res.status(200).json({ message: 'Sale refunded.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.advanceInstallment = async (req, res) => {
  const client = await pool.connect();
  try {
    const { installment_payment_id, business_id, method, amount } = req.body;
    
    if (!installment_payment_id || !business_id || !method || !amount) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    await client.query("BEGIN");

    const payRes = await client.query(
      `SELECT ip.*, ip_plan.business_id, ip_plan.id as plan_id, ip_plan.remaining_balance, ip_plan.order_id 
       FROM installment_payments ip
       JOIN installment_plans ip_plan ON ip.installment_plan_id = ip_plan.id
       WHERE ip.id = $1 AND ip_plan.business_id = $2 AND ip.status = 'pending'`,
      [installment_payment_id, business_id]
    );

    if (payRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Pending installment payment not found." });
    }

    const targetPayment = payRes.rows[0];

    await client.query(
      `UPDATE installment_payments SET status = 'paid', paid_at = NOW(), method = $1, amount = $2 WHERE id = $3`,
      [method, amount, installment_payment_id]
    );

    await client.query(
      `INSERT INTO order_payments (order_id, method, amount, reference) VALUES ($1,$2,$3,$4)`,
      [targetPayment.order_id, method, amount, req.body.reference || null]
    );
    
    await client.query(
      `UPDATE installment_plans SET remaining_balance = remaining_balance - $1 WHERE id = $2`,
      [amount, targetPayment.plan_id]
    );

    await client.query("COMMIT");
    return res.status(200).json({ message: "Installment advanced successfully." });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("advanceInstallment error:", err);
    return res.status(500).json({ message: "Server error." });
  } finally {
    client.release();
  }
};

exports.completeInstallment = async (req, res) => {
  const client = await pool.connect();
  try {
    const { plan_id, business_id, staff_id, created_by_user_id } = req.body;

    if (!plan_id || !business_id) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    await client.query("BEGIN");


    const planRes = await client.query(
      `SELECT ip.*, o.branch_id
         FROM installment_plans ip
         JOIN orders o ON o.id = ip.order_id
        WHERE ip.id = $1 AND ip.business_id = $2`,
      [plan_id, business_id]
    );

    if (planRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Installment plan not found." });
    }

    const plan = planRes.rows[0];

    if (plan.status === 'completed') {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Installment plan already completed." });
    }

    if (Number(plan.remaining_balance) > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Cannot complete. Balance is not fully paid." });
    }

    await client.query(
      `UPDATE installment_plans SET status = 'completed' WHERE id = $1`,
      [plan_id]
    );
    await client.query(
      `UPDATE orders SET status = 'completed' WHERE id = $1`,
      [plan.order_id]
    );

    const orderItems = await client.query(
      `SELECT * FROM order_items WHERE order_id = $1`,
      [plan.order_id]
    );
    const items = orderItems.rows;

    if (items.length > 0) {
      const recorded_by      = staff_id ? String(staff_id) : String(created_by_user_id || plan.customer_id);
      const recorded_by_type = staff_id ? "staff" : "user";
      const variantIds       = items.map(i => i.variant_id);
      const itemQuantities   = items.map(i => Number(i.quantity));

     
      const variantsRes = await client.query(
        `SELECT id, quantity FROM variants WHERE id = ANY($1::int[])`,
        [variantIds]
      );
      const variantQtyMap = new Map(
        variantsRes.rows.map(v => [v.id, Number(v.quantity || 0)])
      );

    
      const newQuantities = items.map(item =>
        (variantQtyMap.get(item.variant_id) ?? 0) - Number(item.quantity)
      );

    
      await client.query(
        `UPDATE variants
            SET quantity = v.new_qty
           FROM (
             SELECT unnest($1::int[])     AS id,
                    unnest($2::numeric[]) AS new_qty
           ) AS v
          WHERE variants.id = v.id`,
        [variantIds, newQuantities]
      );

   
      await client.query(
        `INSERT INTO inventory_logs
           (variant_id, type, quantity, reason, note, business_id, branch_id, recorded_by, recorded_by_type)
         SELECT
           unnest($1::int[]),
           'sale',
           unnest($2::numeric[]),
           'decrease',
           'Installment plan completed',
           $3, $4, $5, $6`,
        [variantIds, itemQuantities, business_id, plan.branch_id, recorded_by, recorded_by_type]
      );
    }

    await client.query("COMMIT");

    if (items.length > 0) {
      Promise.allSettled(
        items.flatMap(item => [
          StockNotificationService.checkLowStock(item.variant_id, business_id),
          StockNotificationService.checkOutOfStock(item.variant_id, business_id),
        ])
      ).then(results => {
        results.forEach(r => {
          if (r.status === 'rejected') {
            console.error('Stock notification failed:', r.reason?.message);
          }
        });
      });
    }

    return res.status(200).json({ message: "Installment plan completed and stock updated." });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("completeInstallment error:", err);
    return res.status(500).json({ message: "Server error." });
  } finally {
    client.release();
  }
};

exports.getBusinessInstallmentPlans = async (req, res) => {
  try {
    const { business_id } = req.params;
    const result = await pool.query(
      `SELECT ip.*, o.order_type, c.name as customer_name 
       FROM installment_plans ip 
       JOIN orders o ON ip.order_id = o.id 
       LEFT JOIN customers c ON ip.customer_id = c.id 
       WHERE ip.business_id = $1 
       ORDER BY ip.created_at DESC`,
      [business_id]
    );
    return res.status(200).json({ plans: result.rows });
  } catch (err) {
    console.error("getBusinessInstallmentPlans error:", err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.getInstallmentPlan = async (req, res) => {
  try {
    const { plan_id } = req.params;
    const result = await pool.query(
      `SELECT ip.*, o.order_type, c.name as customer_name, c.phone as customer_phone, c.email as customer_email,
       b.branch_name, o.total_amount as order_total, o.status as order_status
       FROM installment_plans ip
       JOIN orders o ON ip.order_id = o.id
       LEFT JOIN customers c ON ip.customer_id = c.id
       LEFT JOIN branches b ON o.branch_id = b.id
       WHERE ip.id = $1`,
      [plan_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Installment plan not found.' });
    }
    
    const paymentsRes = await pool.query(
      `SELECT * FROM installment_payments WHERE installment_plan_id = $1 ORDER BY payment_number ASC`,
      [plan_id]
    );
    
    const plan = result.rows[0];
    plan.payments = paymentsRes.rows;
    
    return res.status(200).json({ plan });
  } catch (err) {
    console.error("getInstallmentPlan error:", err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.getInstallmentPayments = async (req, res) => {
  try {
    const { plan_id } = req.params;
    const result = await pool.query(
      `SELECT * FROM installment_payments WHERE installment_plan_id = $1 ORDER BY payment_number ASC`,
      [plan_id]
    );
    return res.status(200).json({ payments: result.rows });
  } catch (err) {
    console.error("getInstallmentPayments error:", err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.getInstallmentPayment = async (req, res) => {
  try {
    const { payment_id } = req.params;
    const result = await pool.query(
      `SELECT pay.*, 
              plan.total_amount as plan_total_amount, plan.remaining_balance, plan.status as plan_status,
              c.name as customer_name, c.phone as customer_phone
       FROM installment_payments pay
       JOIN installment_plans plan ON pay.installment_plan_id = plan.id
       LEFT JOIN customers c ON plan.customer_id = c.id
       WHERE pay.id = $1`,
      [payment_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Installment payment not found.' });
    }
    return res.status(200).json({ payment: result.rows[0] });
  } catch (err) {
    console.error("getInstallmentPayment error:", err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.getBusinessCreditAccounts = async (req, res) => {
  try {
    const { business_id } = req.params;
    const result = await pool.query(
      `SELECT ca.*, o.order_type, c.name as customer_name 
       FROM credit_accounts ca 
       JOIN orders o ON ca.order_id = o.id 
       LEFT JOIN customers c ON ca.customer_id = c.id 
       WHERE ca.business_id = $1 
       ORDER BY ca.created_at DESC`,
      [business_id]
    );
    return res.status(200).json({ accounts: result.rows });
  } catch (err) {
    console.error("getBusinessCreditAccounts error:", err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.getCreditAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT ca.*, o.order_type, c.name as customer_name 
       FROM credit_accounts ca 
       JOIN orders o ON ca.order_id = o.id 
       LEFT JOIN customers c ON ca.customer_id = c.id 
       WHERE ca.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Credit account not found.' });
    }
    return res.status(200).json({ account: result.rows[0] });
  } catch (err) {
    console.error("getCreditAccount error:", err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.deleteSale = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query("BEGIN");

    const orderRes = await client.query(
      `SELECT * FROM orders WHERE id = $1 FOR UPDATE`,
      [id]
    );
    if (orderRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Sale not found" });
    }
    const order = orderRes.rows[0];

    const itemsRes = await client.query(
      `SELECT * FROM order_items WHERE order_id = $1`,
      [id]
    );
    const items = itemsRes.rows;

    if (items.length > 0) {
      const variantIds = items.map(i => i.variant_id);
      const quantities  = items.map(i => i.quantity);

     
      const variantsRes = await client.query(
        `SELECT id FROM variants WHERE id = ANY($1::int[]) FOR UPDATE`,
        [variantIds]
      );

      if (variantsRes.rows.length !== variantIds.length) {
        const foundIds = new Set(variantsRes.rows.map(r => r.id));
        const missing  = variantIds.find(vid => !foundIds.has(vid));
        await client.query("ROLLBACK");
        return res.status(400).json({ message: `Variant ${missing} not found` });
      }

    
      await client.query(
        `UPDATE variants
            SET quantity = quantity + v.qty
           FROM (
             SELECT unnest($1::int[])     AS id,
                    unnest($2::numeric[]) AS qty
           ) AS v
          WHERE variants.id = v.id`,
        [variantIds, quantities]
      );

  
      await client.query(
        `DELETE FROM inventory_logs
          WHERE variant_id = ANY($1::int[])
            AND type = 'sale'
            AND note LIKE $2`,
        [variantIds, `%ORDER_${order.id}%`]
      );
    }

    await client.query(`DELETE FROM order_payments  WHERE order_id = $1`, [id]);
    await client.query(`DELETE FROM order_items      WHERE order_id = $1`, [id]);
    await client.query(`DELETE FROM credit_accounts  WHERE order_id = $1`, [id]);

  
    await client.query(
      `DELETE FROM installment_payments
        WHERE installment_plan_id IN (
          SELECT id FROM installment_plans WHERE order_id = $1
        )`,
      [id]
    );
    await client.query(`DELETE FROM installment_plans WHERE order_id = $1`, [id]);
    await client.query(`DELETE FROM orders            WHERE id = $1`,       [id]);

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "Sale deleted successfully",
      deletedOrder: {
        id:            order.id,
        customer_id:   order.customer_id,
        total_amount:  order.total_amount,
        itemsRefunded: items.length,
      },
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ deleteSale error:", err);
    return res.status(500).json({ message: err.message });
  } finally {
    client.release();
  }
};

exports.settleCreditInstallmentAccount = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    const checkRes = await client.query(`SELECT credit_type, status, order_id, balance, total_amount FROM credit_accounts WHERE id = $1`, [id]);
    if (checkRes.rows.length === 0) {
      client.release();
      return res.status(404).json({ message: 'Credit account not found.' });
    }
    
    const account = checkRes.rows[0];

    if (account.credit_type !== 'installment') {
      client.release();
      return res.status(400).json({ message: 'Only credit accounts with installment type can be settled via this method.' });
    }

    if (account.status === 'settled') {
      client.release();
      return res.status(400).json({ message: 'Credit account is already settled.' });
    }

    await client.query("BEGIN");

    const balanceRemaining = Number(account.balance);
    if (balanceRemaining > 0) {
      await client.query(
        `INSERT INTO order_payments (order_id, method, amount, reference) VALUES ($1, $2, $3, $4)`,
        [account.order_id, req.body.method || 'cash', balanceRemaining, req.body.reference || 'Credit Settlement']
      );
    }

    const result = await client.query(
      `UPDATE credit_accounts 
       SET status = 'settled',
           amount_paid = total_amount,
           balance = 0,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    await client.query("COMMIT");
    client.release();

    return res.status(200).json({ message: 'Credit account marked as settled.', account: result.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    client.release();
    console.error("settleCreditInstallmentAccount error:", err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
