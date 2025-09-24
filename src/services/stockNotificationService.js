const pool = require('../config/db');
const { sendNotificationEmail } = require('./emailService');

async function getBusinessOwnerEmail(business_id) {
  try {
    const res = await pool.query(
      `SELECT u.email
       FROM businesses b
       JOIN users u ON b.user_id = u.id
       WHERE b.id = $1
       LIMIT 1`,
      [business_id]
    );

    if (res.rows.length > 0) return res.rows[0].email;
    return null;
  } catch (err) {
    console.error("Error fetching business owner email:", err);
    return null;
  }
}

class StockNotificationService {
// Check and create low stock notifications
static async checkLowStock(variant_id, business_id) {
  try {
    const variant = await pool.query(`
      SELECT v.*, p.name as product_name
      FROM variants v
      JOIN products p ON v.product_id = p.id
      WHERE v.id = $1 AND p.business_id = $2
    `, [variant_id, business_id]);

    if (variant.rows.length === 0) return;

    const v = variant.rows[0];

    // Check if already has unread low stock notification
    const existingNotification = await pool.query(`
      SELECT id FROM stock_notifications 
      WHERE variant_id = $1 AND notification_type = 'low_stock' AND is_read = false
    `, [variant_id]);

    if (existingNotification.rows.length > 0) return;

    // Create low stock notification
    if (v.quantity <= v.threshold && v.quantity > 0) {
      await pool.query(`
        INSERT INTO stock_notifications (
          business_id, variant_id, notification_type, message
        ) VALUES ($1, $2, $3, $4)
      `, [
        business_id, 
        variant_id, 
        'low_stock',
        `Low stock alert: ${v.product_name} (${v.sku}) - Current: ${v.quantity}, Threshold: ${v.threshold}`
      ]);

      // Send email notification to relevant staff
      await this.sendLowStockEmail(business_id, v);
    }
  } catch (error) {
    console.error('Error checking low stock:', error);
  }
}

// Check and create out of stock notifications
static async checkOutOfStock(variant_id, business_id) {
  try {
    const variant = await pool.query(`
      SELECT v.*, p.name as product_name
      FROM variants v
      JOIN products p ON v.product_id = p.id
      WHERE v.id = $1 AND p.business_id = $2
    `, [variant_id, business_id]);

    if (variant.rows.length === 0) return;

    const v = variant.rows[0];

    // Check if already has unread out of stock notification
    const existingNotification = await pool.query(`
      SELECT id FROM stock_notifications 
      WHERE variant_id = $1 AND notification_type = 'out_of_stock' AND is_read = false
    `, [variant_id]);

    if (existingNotification.rows.length > 0) return;

    // Create out of stock notification
    if (v.quantity === 0) {
      await pool.query(`
        INSERT INTO stock_notifications (
          business_id, variant_id, notification_type, message
        ) VALUES ($1, $2, $3, $4)
      `, [
        business_id, 
        variant_id, 
        'out_of_stock',
        `Out of stock: ${v.product_name} (${v.sku})`
      ]);

      // Send email notification
      await this.sendOutOfStockEmail(business_id, v);
    }
  } catch (error) {
    console.error('Error checking out of stock:', error);
  }
}

  // Create transfer notification
  static async createTransferNotification(transfer_id, business_id) {
    try {
      const transfer = await pool.query(`
        SELECT st.*, 
               v.sku, v.name as variant_name,
               p.name as product_name,
               fb.name as from_branch_name,
               tb.name as to_branch_name,
               s.full_name as initiated_by_name
        FROM stock_transfers st
        JOIN variants v ON st.variant_id = v.id
        JOIN products p ON v.product_id = p.id
        JOIN branches fb ON st.from_branch_id = fb.id
        JOIN branches tb ON st.to_branch_id = tb.id
        LEFT JOIN staff s ON st.initiated_by = s.staff_id
        WHERE st.id = $1 AND st.business_id = $2
      `, [transfer_id, business_id]);

      if (transfer.rows.length === 0) return;

      const t = transfer.rows[0];

      // Create notification for destination branch
      await pool.query(`
        INSERT INTO stock_notifications (
          business_id, variant_id, notification_type, message
        ) VALUES ($1, $2, $3, $4)
      `, [
        business_id,
        t.variant_id,
        'transfer_pending',
        `Stock transfer pending: ${t.quantity} units of ${t.product_name} (${t.sku}) from ${t.from_branch_name} to ${t.to_branch_name}. Reason: ${t.reason}`
      ]);

      // Send email notification to destination branch staff
      await this.sendTransferNotificationEmail(business_id, t);
    } catch (error) {
      console.error('Error creating transfer notification:', error);
    }
  }

  // Mark notification as read
  static async markAsRead(notification_id, user_id) {
    try {
      await pool.query(`
        UPDATE stock_notifications 
        SET is_read = true, read_at = NOW(), read_by = $1
        WHERE id = $2
      `, [user_id, notification_id]);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Get unread notifications for business
  static async getUnreadNotifications(business_id, limit = 50) {
    try {
      const result = await pool.query(`
        SELECT sn.*, 
               v.sku, v.name as variant_name,
               p.name as product_name,
               b.name as branch_name
        FROM stock_notifications sn
        LEFT JOIN variants v ON sn.variant_id = v.id
        LEFT JOIN products p ON v.product_id = p.id
        LEFT JOIN branches b ON v.branch_id = b.id
        WHERE sn.business_id = $1 AND sn.is_read = false
        ORDER BY sn.created_at DESC
        LIMIT $2
      `, [business_id, limit]);

      return result.rows;
    } catch (error) {
      console.error('Error getting unread notifications:', error);
      return [];
    }
  }

  // Get notification statistics
  static async getNotificationStats(business_id) {
    try {
      const result = await pool.query(`
        SELECT 
          notification_type,
          COUNT(*) as total,
          COUNT(CASE WHEN is_read = false THEN 1 END) as unread
        FROM stock_notifications
        WHERE business_id = $1
        GROUP BY notification_type
      `, [business_id]);

      return result.rows;
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return [];
    }
  }

  // Email notification methods
  static async sendLowStockEmail(business_id, variant) {
    try {
      // Get staff emails for this business/branch
      const staffEmails = await pool.query(`
        SELECT DISTINCT s.email 
        FROM staff s
        WHERE s.business_id = $1 AND s.is_active = true
      `, [business_id]);

     

      const emails = staffEmails.rows.map(row => row.email);

      if (emails.length === 0) {
      const ownerEmail = await getBusinessOwnerEmail(business_id);
      if (ownerEmail) emails = [ownerEmail];
      else return; 
    }

      const subject = `Low Stock Alert - ${variant.product_name}`;
      const message = `
        Low stock alert for ${variant.product_name} (${variant.sku}) in ${variant.branch_name}.
        Current quantity: ${variant.quantity}
        Threshold: ${variant.threshold}
        Please restock soon to avoid stockouts.
      `;

      for (const email of emails) {
        await sendNotificationEmail(email, subject, message);
      }
    } catch (error) {
      console.error('Error sending low stock email:', error);
    }
  }

  static async sendOutOfStockEmail(business_id, variant) {
    try {
      // Get staff emails for this business/branch
      const staffEmails = await pool.query(`
        SELECT DISTINCT s.email 
        FROM staff s
        WHERE s.business_id = $1 AND s.is_active = true
      `, [business_id]);

      

      const emails = staffEmails.rows.map(row => row.email);

        if (emails.length === 0) {
      const ownerEmail = await getBusinessOwnerEmail(business_id);
      if (ownerEmail) emails = [ownerEmail];
      else return;
    }


      const subject = `URGENT: Out of Stock - ${variant.product_name}`;
      const message = `
        CRITICAL: ${variant.product_name} (${variant.sku}) is now OUT OF STOCK in ${variant.branch_name}.
        Immediate action required to restock this item.
      `;

      for (const email of emails) {
        await sendNotificationEmail(email, subject, message);
      }
    } catch (error) {
      console.error('Error sending out of stock email:', error);
    }
  }

  static async sendTransferNotificationEmail(business_id, transfer) {
    try {
      // Get staff emails for destination branch
      const staffEmails = await pool.query(`
        SELECT DISTINCT s.email 
        FROM staff s
        WHERE s.business_id = $1 AND s.branch_id = $2 AND s.is_active = true
      `, [business_id, transfer.to_branch_id]);

     

      const emails = staffEmails.rows.map(row => row.email);

        if (emails.length === 0) {
      const ownerEmail = await getBusinessOwnerEmail(business_id);
      if (ownerEmail) emails = [ownerEmail];
      else return;
    }

      const subject = `Stock Transfer Pending - ${transfer.product_name}`;
      const message = `
        A stock transfer has been initiated for ${transfer.product_name} (${transfer.sku}).
        Quantity: ${transfer.quantity} units
        From: ${transfer.from_branch_name}
        To: ${transfer.to_branch_name}
        Reason: ${transfer.reason}
        Expected delivery: ${transfer.expected_delivery_date || 'Not specified'}
        Please prepare to receive this stock.
      `;

      for (const email of emails) {
        await sendNotificationEmail(email, subject, message);
      }
    } catch (error) {
      console.error('Error sending transfer notification email:', error);
    }
  }

  // Clean up old notifications (optional)
  static async cleanupOldNotifications(business_id, daysOld = 30) {
    try {
      await pool.query(`
        DELETE FROM stock_notifications 
        WHERE business_id = $1 AND created_at < NOW() - INTERVAL '${daysOld} days'
      `, [business_id]);
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
    }
  }
}

module.exports = StockNotificationService; 