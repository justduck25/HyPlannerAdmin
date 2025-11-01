const express = require('express');
const router = express.Router();

// Get admin profile
router.get('/profile', (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: 'admin123',
        email: 'admin@hyplanner.com',
        role: 'ADMIN',
        name: 'Admin User'
      }
    }
  });
});

// System settings endpoints
router.get('/settings', (req, res) => {
  // In a real app, these would come from database
  const settings = {
    siteName: 'HyPlanner Admin',
    maintenanceMode: false,
    allowRegistration: true,
    emailVerificationRequired: true,
    maxUsersPerAccount: 1000,
    sessionTimeout: 7200, // 2 hours in seconds
    backupFrequency: 'daily',
    logLevel: 'info'
  };

  res.json({
    success: true,
    data: { settings }
  });
});

router.put('/settings', (req, res) => {
  // In a real app, these would be saved to database
  const allowedSettings = [
    'siteName',
    'maintenanceMode', 
    'allowRegistration',
    'emailVerificationRequired',
    'maxUsersPerAccount',
    'sessionTimeout',
    'backupFrequency',
    'logLevel'
  ];

  const updatedSettings = {};
  
  Object.keys(req.body).forEach(key => {
    if (allowedSettings.includes(key)) {
      updatedSettings[key] = req.body[key];
    }
  });

  res.json({
    success: true,
    message: 'Settings updated successfully',
    data: { settings: updatedSettings }
  });
});

// System logs endpoint
router.get('/logs', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const level = req.query.level || 'all';

  // Mock log data - in real app, this would come from log files or database
  const mockLogs = [
    {
      id: 1,
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'User login successful',
      details: { userId: 'user123', ip: '192.168.1.1' }
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 300000).toISOString(),
      level: 'warning',
      message: 'High memory usage detected',
      details: { usage: '85%' }
    },
    {
      id: 3,
      timestamp: new Date(Date.now() - 600000).toISOString(),
      level: 'error',
      message: 'Database connection timeout',
      details: { duration: '5000ms' }
    }
  ];

  const filteredLogs = level === 'all' 
    ? mockLogs 
    : mockLogs.filter(log => log.level === level);

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: {
      logs: paginatedLogs,
      pagination: {
        current: page,
        pages: Math.ceil(filteredLogs.length / limit),
        total: filteredLogs.length,
        limit
      }
    }
  });
});

// Clear logs endpoint
router.delete('/logs', (req, res) => {
  // In a real app, this would clear log files or database entries
  res.json({
    success: true,
    message: 'Logs cleared successfully'
  });
});

// Database backup endpoint
router.post('/backup', (req, res) => {
  // Mock backup process
  const backupId = `backup_${Date.now()}`;
  
  res.json({
    success: true,
    message: 'Backup initiated successfully',
    data: {
      backupId,
      status: 'in_progress',
      startTime: new Date().toISOString()
    }
  });
});

// Get backup status
router.get('/backup/:backupId', (req, res) => {
  const { backupId } = req.params;
  
  // Mock backup status
  res.json({
    success: true,
    data: {
      backupId,
      status: 'completed',
      startTime: new Date(Date.now() - 120000).toISOString(),
      endTime: new Date().toISOString(),
      size: '15.2 MB',
      location: `/backups/${backupId}.sql`
    }
  });
});

// System maintenance endpoints
router.post('/maintenance/enable', (req, res) => {
  res.json({
    success: true,
    message: 'Maintenance mode enabled',
    data: {
      maintenanceMode: true,
      enabledAt: new Date().toISOString()
    }
  });
});

router.post('/maintenance/disable', (req, res) => {
  res.json({
    success: true,
    message: 'Maintenance mode disabled',
    data: {
      maintenanceMode: false,
      disabledAt: new Date().toISOString()
    }
  });
});

// Cache management
router.delete('/cache', (req, res) => {
  res.json({
    success: true,
    message: 'Cache cleared successfully'
  });
});

// System restart (mock)
router.post('/restart', (req, res) => {
  res.json({
    success: true,
    message: 'System restart initiated',
    data: {
      restartTime: new Date(Date.now() + 10000).toISOString()
    }
  });
});

module.exports = router;
