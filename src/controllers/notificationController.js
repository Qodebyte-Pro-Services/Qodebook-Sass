// notificationController.js
module.exports = {
  getNotifications: async (req, res) => {
    // TODO: Fetch notifications for user
    res.json({ notifications: [] });
  },
  markRead: async (req, res) => {
    // TODO: Mark notifications as read
    res.json({ message: 'Notifications marked as read (stub)' });
  },
};
