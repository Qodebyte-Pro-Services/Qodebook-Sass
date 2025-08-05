const pool = require('../config/db');


module.exports = (action_type, resource_type = null, resource_info = null) => async (req, res, next) => {
  try {
    const business_id = req.business_id || req.body.business_id || req.user?.business_id || null;
    const user_id = req.user?.user_id || req.user?.id || null;
    const staff_id = req.user?.staff_id || null;
    const ip_address = req.ip;
    const user_agent = req.headers['user-agent'];

   
    const checkEnhancedStructure = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'audit_logs' 
      AND column_name = 'resource_type'
    `);

    const hasEnhancedStructure = checkEnhancedStructure.rows.length > 0;

    if (hasEnhancedStructure && resource_type) {
     
      const {
        resource_id = null,
        resource_name = null,
        old_values = null,
        new_values = null,
        additional_data = null
      } = resource_info || {};

      await pool.query(`
        INSERT INTO audit_logs (
          business_id, user_id, staff_id, action_type, resource_type,
          resource_id, resource_name, old_values, new_values,
          ip_address, user_agent, additional_data, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      `, [
        business_id, user_id, staff_id, action_type, resource_type,
        resource_id, resource_name,
        old_values ? JSON.stringify(old_values) : null,
        new_values ? JSON.stringify(new_values) : null,
        ip_address, user_agent,
        additional_data ? JSON.stringify(additional_data) : null
      ]);
    } else {
     
      const details = resource_info ? JSON.stringify(resource_info) : null;
      
      await pool.query(`
        INSERT INTO audit_logs (
          business_id, user_id, staff_id, action_type, details, 
          ip_address, user_agent, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `, [business_id, user_id, staff_id, action_type, details, ip_address, user_agent]);
    }
  } catch (err) {
    console.error('Audit log error:', err);
   
  }
  next();
};


module.exports.simple = (action_type) => {
  return module.exports(action_type);
};


module.exports.resource = (action_type, resource_type, resource_info) => {
  return module.exports(action_type, resource_type, resource_info);
};


module.exports.update = (resource_type, resource_info) => {
  return async (req, res, next) => {
    
    req._auditInfo = {
      resource_type,
      resource_info,
      action_type: 'update'
    };
    next();
  };
};


module.exports.afterUpdate = async (req, res, next) => {
  try {
    if (req._auditInfo && req._auditInfo.action_type === 'update') {
      const { resource_type, resource_info } = req._auditInfo;
      
     
      const updatedData = res.locals?.updatedData || req.body;
      
      await module.exports('update', resource_type, {
        ...resource_info,
        old_values: req._auditInfo.old_values,
        new_values: updatedData
      })(req, res, () => {});
    }
  } catch (err) {
    console.error('After update audit log error:', err);
  }
  next();
};
