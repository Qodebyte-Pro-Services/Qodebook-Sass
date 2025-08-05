const AuditService = require('../services/auditService');


exports.getAuditLogs = async (req, res) => {
  try {
    const { business_id } = req.params;
    const {
      action_type,
      resource_type,
      user_id,
      staff_id,
      start_date,
      end_date,
      limit = 50,
      offset = 0
    } = req.query;

    if (req.user.business_id != business_id && !req.user.isOwner) {
      return res.status(403).json({ message: 'Access denied to this business.' });
    }

    const filters = {
      action_type,
      resource_type,
      user_id: user_id ? parseInt(user_id) : null,
      staff_id: staff_id ? parseInt(staff_id) : null,
      start_date,
      end_date,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    const auditLogs = await AuditService.getAuditLogs(business_id, filters);

    return res.status(200).json({
      audit_logs: auditLogs,
      filters,
      total: auditLogs.length
    });

  } catch (error) {
    console.error('Error getting audit logs:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.getAuditStats = async (req, res) => {
  try {
    const { business_id } = req.params;
    const { start_date, end_date } = req.query;

   
    if (req.user.business_id != business_id && !req.user.isOwner) {
      return res.status(403).json({ message: 'Access denied to this business.' });
    }

    const stats = await AuditService.getAuditStats(business_id, start_date, end_date);

    return res.status(200).json({
      audit_stats: stats,
      period: { start_date, end_date }
    });

  } catch (error) {
    console.error('Error getting audit stats:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.getResourceAuditLogs = async (req, res) => {
  try {
    const { business_id, resource_type, resource_id } = req.params;
    const { limit = 20, offset = 0 } = req.query;


    if (req.user.business_id != business_id && !req.user.isOwner) {
      return res.status(403).json({ message: 'Access denied to this business.' });
    }

    const filters = {
      resource_type,
      resource_id,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    const auditLogs = await AuditService.getAuditLogs(business_id, filters);

    return res.status(200).json({
      resource_audit_logs: auditLogs,
      resource_type,
      resource_id,
      total: auditLogs.length
    });

  } catch (error) {
    console.error('Error getting resource audit logs:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};


exports.getUserActivity = async (req, res) => {
  try {
    const { business_id } = req.params;
    const { user_id, staff_id, start_date, end_date } = req.query;


    if (req.user.business_id != business_id && !req.user.isOwner) {
      return res.status(403).json({ message: 'Access denied to this business.' });
    }

    const filters = {
      user_id: user_id ? parseInt(user_id) : null,
      staff_id: staff_id ? parseInt(staff_id) : null,
      start_date,
      end_date
    };

    const auditLogs = await AuditService.getAuditLogs(business_id, filters);


    const activitySummary = auditLogs.reduce((acc, log) => {
      const actionType = log.action_type;
      if (!acc[actionType]) {
        acc[actionType] = 0;
      }
      acc[actionType]++;
      return acc;
    }, {});

    return res.status(200).json({
      user_activity: {
        total_actions: auditLogs.length,
        activity_summary: activitySummary,
        recent_actions: auditLogs.slice(0, 10) 
      },
      filters
    });

  } catch (error) {
    console.error('Error getting user activity:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.exportAuditLogs = async (req, res) => {
  try {
    const { business_id } = req.params;
    const {
      action_type,
      resource_type,
      start_date,
      end_date,
      format = 'json'
    } = req.query;

    if (req.user.business_id != business_id && !req.user.isOwner) {
      return res.status(403).json({ message: 'Access denied to this business.' });
    }

    const filters = {
      action_type,
      resource_type,
      start_date,
      end_date,
      limit: 1000 
    };

    const auditLogs = await AuditService.getAuditLogs(business_id, filters);

    if (format === 'csv') {

      const csvHeaders = [
        'ID', 'Business ID', 'User ID', 'Staff ID', 'Action Type', 
        'Resource Type', 'Resource ID', 'Resource Name', 'IP Address', 
        'User Agent', 'Created At'
      ];

      const csvData = auditLogs.map(log => [
        log.id,
        log.business_id,
        log.user_id || '',
        log.staff_id || '',
        log.action_type,
        log.resource_type,
        log.resource_id || '',
        log.resource_name || '',
        log.ip_address || '',
        log.user_agent || '',
        log.created_at
      ]);

      const csvContent = [csvHeaders, ...csvData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="audit_logs_${business_id}_${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send(csvContent);
    } else {
   
      return res.status(200).json({
        export_data: {
          business_id,
          export_date: new Date().toISOString(),
          total_records: auditLogs.length,
          filters,
          audit_logs: auditLogs
        }
      });
    }

  } catch (error) {
    console.error('Error exporting audit logs:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
}; 