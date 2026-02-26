const pool = require('../config/db');
const { userSockets, io } = require('../realtime');
const { sendNotificationEmail } = require('../services/emailService');


module.exports = {
  createAndNotify: async (req, res) => {
    try {
      const userId = req.user.id;
      const businessId = req.user.business_id;
      const { type, message, email, variant_id } = req.body;

      
      if (!variant_id) {
        return res.status(400).json({ message: 'variant_id is required.' });
      }
      
      const result = await pool.query(
        `INSERT INTO stock_notifications 
         (business_id, variant_id, notification_type, message) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [businessId, variant_id, type, message]
      );
     
      if (email) {
        try {
          await sendNotificationEmail(email, `Qodebook Notification: ${type}`, message);
        } catch (emailErr) {
          console.warn('Email send failed:', emailErr.message);
        }
      }
      
   
      if (userSockets && io) {
        const socketId = userSockets.get(String(userId));
        if (socketId) {
          io.to(socketId).emit('notification', result.rows[0]);
        }
      }
      
      return res.status(201).json({ 
        notification: result.rows[0], 
        emailSent: !!email 
      });
    } catch (err) {
      console.error('Error creating notification:');
      return res.status(500).json({ 
        message: 'Failed to create notification',
         
      });
    }
  },
  
  getNotifications: async (req, res) => {
    try {
      const businessId = req.user.business_id;
      const { limit = 50, unread_only = false } = req.query;
      
      let query = `SELECT * FROM stock_notifications WHERE business_id = $1`;
      let params = [businessId];

      if (unread_only === 'true') {
        query += ` AND is_read = false`;
      }

      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
      params.push(parseInt(limit));

      const result = await pool.query(query, params);
      
      return res.status(200).json({ 
        notifications: result.rows,
        total: result.rows.length 
      });
    } catch (err) {
      console.error('Error fetching notifications:');
      return res.status(500).json({ 
        message: 'Failed to fetch notifications',
         
      });
    }
  },

  markRead: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const result = await pool.query(
        `UPDATE stock_notifications 
         SET is_read = true, read_at = NOW(), read_by = $1 
         WHERE id = $2 
         RETURNING *`,
        [String(userId), id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Notification not found.' });
      }

      return res.status(200).json({ 
        message: 'Notification marked as read',
        notification: result.rows[0]
      });
    } catch (err) {
      console.error('Error marking notification as read:');
      return res.status(500).json({ 
        message: 'Failed to mark notification as read',
         
      });
    }
  },

  markAllRead: async (req, res) => {
    try {
      const userId = req.user.id;
      const businessId = req.user.business_id;

      const result = await pool.query(
        `UPDATE stock_notifications 
         SET is_read = true, read_at = NOW(), read_by = $1 
         WHERE business_id = $2 AND is_read = false 
         RETURNING id`,
        [String(userId), businessId]
      );

      return res.status(200).json({ 
        message: `Marked ${result.rows.length} notifications as read`,
        marked_count: result.rows.length
      });
    } catch (err) {
      console.error('Error marking all notifications as read:');
      return res.status(500).json({ 
        message: 'Failed to mark notifications as read',
         
      });
    }
  },

  getUnreadCount: async (req, res) => {
    try {
      const businessId = req.user.business_id;

      const result = await pool.query(
        `SELECT COUNT(*) as unread_count 
         FROM stock_notifications 
         WHERE business_id = $1 AND is_read = false`,
        [businessId]
      );

      return res.status(200).json({ 
        unread_count: parseInt(result.rows[0].unread_count)
      });
    } catch (err) {
      console.error('Error fetching unread count:');
      return res.status(500).json({ 
        message: 'Failed to fetch unread count',
         
      });
    }
  }
};