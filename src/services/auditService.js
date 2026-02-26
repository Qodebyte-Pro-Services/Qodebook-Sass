const pool = require('../config/db');

class AuditService {

  static async hasEnhancedStructure() {
    try {
      const result = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'audit_logs' 
        AND column_name = 'resource_type'
      `);
      return result.rows.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Log an action to the audit logs
   * @param {Object} params - Audit log parameters
   * @param {number} params.business_id - Business ID
   * @param {number} params.user_id - User ID (for owner actions)
   * @param {number} params.staff_id - Staff ID (for staff actions)
   * @param {string} params.action_type - Type of action (create, update, delete, etc.)
   * @param {string} params.resource_type - Type of resource (product, stock, sale, etc.)
   * @param {string} params.resource_id - ID of the affected resource
   * @param {string} params.resource_name - Human-readable name of the resource
   * @param {Object} params.old_values - Previous state (for updates)
   * @param {Object} params.new_values - New state (for updates/creates)
   * @param {string} params.ip_address - IP address of the user
   * @param {string} params.user_agent - User agent string
   * @param {Object} params.additional_data - Any extra context
   */
  static async logAction(params) {
    try {
      const {
        business_id,
        user_id = null,
        staff_id = null,
        action_type,
        resource_type,
        resource_id,
        resource_name,
        old_values = null,
        new_values = null,
        ip_address = null,
        user_agent = null,
        additional_data = null
      } = params;

      if (!business_id || !action_type) {
        console.error('AuditService: Missing required parameters', params);
        return;
      }

      const hasEnhanced = await this.hasEnhancedStructure();

      if (hasEnhanced && resource_type) {

        const query = `
          INSERT INTO audit_logs (
            business_id, user_id, staff_id, action_type, resource_type, 
            resource_id, resource_name, old_values, new_values, 
            ip_address, user_agent, additional_data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `;

        const values = [
          business_id, user_id, staff_id, action_type, resource_type,
          resource_id, resource_name, 
          old_values ? JSON.stringify(old_values) : null,
          new_values ? JSON.stringify(new_values) : null,
          ip_address, user_agent,
          additional_data ? JSON.stringify(additional_data) : null
        ];

        await pool.query(query, values);
      } else {
       
        const details = {
          resource_type,
          resource_id,
          resource_name,
          old_values,
          new_values,
          additional_data
        };

        const query = `
          INSERT INTO audit_logs (
            business_id, user_id, staff_id, action_type, details, 
            ip_address, user_agent
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;

        const values = [
          business_id, user_id, staff_id, action_type,
          JSON.stringify(details), ip_address, user_agent
        ];

        await pool.query(query, values);
      }
    } catch (error) {
      console.error('AuditService: Error logging action');
    
    }
  }

  
  static async logProductAction(action_type, product_id, product_name, business_id, user, old_values = null, new_values = null, req = null) {
    await this.logAction({
      business_id,
      user_id: user?.user_id || user?.id || null,
      staff_id: user?.staff_id || null,
      action_type,
      resource_type: 'product',
      resource_id: product_id,
      resource_name: product_name,
      old_values,
      new_values,
      ip_address: req?.ip || null,
      user_agent: req?.get('User-Agent') || null
    });
  }

 
  static async logStockAction(action_type, variant_id, product_name, business_id, user, old_values = null, new_values = null, req = null) {
    await this.logAction({
      business_id,
      user_id: user?.user_id || user?.id || null,
      staff_id: user?.staff_id || null,
      action_type,
      resource_type: 'stock',
      resource_id: variant_id,
      resource_name: product_name,
      old_values,
      new_values,
      ip_address: req?.ip || null,
      user_agent: req?.get('User-Agent') || null
    });
  }


  static async logSaleAction(action_type, sale_id, sale_reference, business_id, user, old_values = null, new_values = null, req = null) {
    await this.logAction({
      business_id,
      user_id: user?.user_id || user?.id || null,
      staff_id: user?.staff_id || null,
      action_type,
      resource_type: 'sale',
      resource_id: sale_id,
      resource_name: sale_reference,
      old_values,
      new_values,
      ip_address: req?.ip || null,
      user_agent: req?.get('User-Agent') || null
    });
  }

  static async logStaffAction(action_type, staff_id, staff_name, business_id, user, old_values = null, new_values = null, req = null) {
    await this.logAction({
      business_id,
      user_id: user?.user_id || user?.id || null,
      staff_id: user?.staff_id || null,
      action_type,
      resource_type: 'staff',
      resource_id: staff_id,
      resource_name: staff_name,
      old_values,
      new_values,
      ip_address: req?.ip || null,
      user_agent: req?.get('User-Agent') || null
    });
  }

  static async logBusinessAction(action_type, business_id, business_name, user, old_values = null, new_values = null, req = null) {
    await this.logAction({
      business_id,
      user_id: user?.user_id || user?.id || null,
      staff_id: user?.staff_id || null,
      action_type,
      resource_type: 'business',
      resource_id: business_id,
      resource_name: business_name,
      old_values,
      new_values,
      ip_address: req?.ip || null,
      user_agent: req?.get('User-Agent') || null
    });
  }


  static async logAuthAction(action_type, user_id, user_email, business_id, req = null) {
    await this.logAction({
      business_id,
      user_id,
      action_type,
      resource_type: 'auth',
      resource_id: user_id,
      resource_name: user_email,
      ip_address: req?.ip || null,
      user_agent: req?.get('User-Agent') || null,
      additional_data: { action_type }
    });
  }


  static async getAuditLogs(business_id, filters = {}) {
    try {
      const {
        action_type,
        resource_type,
        user_id,
        staff_id,
        start_date,
        end_date,
        limit = 50,
        offset = 0
      } = filters;

      const hasEnhanced = await this.hasEnhancedStructure();

      if (hasEnhanced) {
       
        let query = `
          SELECT 
            al.*,
            u.email as user_email,
            s.full_name as staff_name
          FROM audit_logs al
          LEFT JOIN users u ON al.user_id = u.id
          LEFT JOIN staff s ON al.staff_id = s.staff_id
          WHERE al.business_id = $1
        `;
        
        let params = [business_id];
        let paramIndex = 2;

        if (action_type) {
          query += ` AND al.action_type = $${paramIndex}`;
          params.push(action_type);
          paramIndex++;
        }

        if (resource_type) {
          query += ` AND al.resource_type = $${paramIndex}`;
          params.push(resource_type);
          paramIndex++;
        }

        if (user_id) {
          query += ` AND al.user_id = $${paramIndex}`;
          params.push(user_id);
          paramIndex++;
        }

        if (staff_id) {
          query += ` AND al.staff_id = $${paramIndex}`;
          params.push(staff_id);
          paramIndex++;
        }

        if (start_date) {
          query += ` AND al.created_at >= $${paramIndex}`;
          params.push(start_date);
          paramIndex++;
        }

        if (end_date) {
          query += ` AND al.created_at <= $${paramIndex}`;
          params.push(end_date);
          paramIndex++;
        }

        query += ` ORDER BY al.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);
        return result.rows;
      } else {
       
        let query = `
          SELECT 
            al.*,
            u.email as user_email
          FROM audit_logs al
          LEFT JOIN users u ON al.user_id = u.id
          WHERE al.business_id = $1
        `;
        
        let params = [business_id];
        let paramIndex = 2;

        if (action_type) {
          query += ` AND al.action_type = $${paramIndex}`;
          params.push(action_type);
          paramIndex++;
        }

        if (start_date) {
          query += ` AND al.created_at >= $${paramIndex}`;
          params.push(start_date);
          paramIndex++;
        }

        if (end_date) {
          query += ` AND al.created_at <= $${paramIndex}`;
          params.push(end_date);
          paramIndex++;
        }

        query += ` ORDER BY al.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);
        return result.rows;
      }
    } catch (error) {
      console.error('AuditService: Error getting audit logs');
      throw error;
    }
  }

 
  static async getAuditStats(business_id, start_date = null, end_date = null) {
    try {
      const hasEnhanced = await this.hasEnhancedStructure();

      if (hasEnhanced) {
        let query = `
          SELECT 
            action_type,
            resource_type,
            COUNT(*) as count
          FROM audit_logs
          WHERE business_id = $1
        `;
        
        let params = [business_id];
        let paramIndex = 2;

        if (start_date) {
          query += ` AND created_at >= $${paramIndex}`;
          params.push(start_date);
          paramIndex++;
        }

        if (end_date) {
          query += ` AND created_at <= $${paramIndex}`;
          params.push(end_date);
          paramIndex++;
        }

        query += ` GROUP BY action_type, resource_type ORDER BY count DESC`;

        const result = await pool.query(query, params);
        return result.rows;
      } else {
      
        let query = `
          SELECT 
            action_type,
            COUNT(*) as count
          FROM audit_logs
          WHERE business_id = $1
        `;
        
        let params = [business_id];
        let paramIndex = 2;

        if (start_date) {
          query += ` AND created_at >= $${paramIndex}`;
          params.push(start_date);
          paramIndex++;
        }

        if (end_date) {
          query += ` AND created_at <= $${paramIndex}`;
          params.push(end_date);
          paramIndex++;
        }

        query += ` GROUP BY action_type ORDER BY count DESC`;

        const result = await pool.query(query, params);
        return result.rows.map(row => ({
          ...row,
          resource_type: 'legacy'
        }));
      }
    } catch (error) {
      console.error('AuditService: Error getting audit stats');
      throw error;
    }
  }
}

module.exports = AuditService; 