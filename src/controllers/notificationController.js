


const pool = require('../config/db');
const { sendNotificationEmail } = require('../services/emailService');
const { io, userSockets } = require('../realtime');

 

module.exports = {

   createAndNotify: async (req, res) => {
    try {
      const userId = req.user.id;
      const businessId = req.user.business_id;
      const { type, message, email } = req.body;
      
      const result = await pool.query(
        'INSERT INTO notifications (user_id, business_id, type, message) VALUES ($1, $2, $3, $4) RETURNING *',
        [userId, businessId, type, message]
      );
     
      if (email) {
        await sendNotificationEmail(email, `Qodebook Notification: ${type}`, message);
      }
      
      const socketId = userSockets.get(String(userId));
      if (socketId) {
        io.to(socketId).emit('notification', result.rows[0]);
      }
      res.status(201).json({ notification: result.rows[0], emailSent: !!email });
    } catch (err) {
      console.error('Error creating notification and sending email:', err);
      res.status(500).json({ message: 'Failed to create notification or send email' });
    }
  },
  
  getNotifications: async (req, res) => {
    try {
      const userId = req.user.id;
      const businessId = req.user.business_id;
      let result;
      
      if (req.query.business && businessId) {
        result = await pool.query(
          'SELECT * FROM notifications WHERE business_id = $1 ORDER BY created_at DESC',
          [businessId]
        );
      } else {
        result = await pool.query(
          'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
          [userId]
        );
      }
      res.json({ notifications: result.rows });
    } catch (err) {
      console.error('Error fetching notifications:', err);
      res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  },

  
  markRead: async (req, res) => {
    try {
      const userId = req.user.id;
      await pool.query(
        'UPDATE notifications SET read = TRUE WHERE user_id = $1 AND read = FALSE',
        [userId]
      );
      res.json({ message: 'Notifications marked as read' });
    } catch (err) {
      console.error('Error marking notifications as read:', err);
      res.status(500).json({ message: 'Failed to mark notifications as read' });
    }
  },
};
