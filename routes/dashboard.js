const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Helper function to map account types
function mapAccountType(backendType) {
  const mapping = {
    'BASIC': 'FREE',
    'FREE': 'FREE',
    'PREMIUM': 'VIP',
    'VIP': 'VIP',
    'SUPER': 'SUPER'
  };
  return mapping[backendType] || backendType;
}

// Get dashboard stats (alias for overview)
router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      totalUsers,
      activeUsers,
      todayUsers,
      weekUsers,
      monthUsers,
      yearUsers,
      accountTypeStats,
      recentUsers
    ] = await Promise.all([
      // Total users
      User.countDocuments(),
      
      // Active users
      User.countDocuments({ isVerified: true }),
      
      // Today's new users
      User.countDocuments({ 
        createdAt: { $gte: startOfDay } 
      }),
      
      // This week's new users
      User.countDocuments({ 
        createdAt: { $gte: startOfWeek } 
      }),
      
      // This month's new users
      User.countDocuments({ 
        createdAt: { $gte: startOfMonth } 
      }),
      
      // This year's new users
      User.countDocuments({ 
        createdAt: { $gte: startOfYear } 
      }),
      
      // Account type distribution
      User.aggregate([
        {
          $group: {
            _id: '$accountType',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Recent users (last 5)
      User.find()
        .select('fullName email accountType createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    // Format account type stats
    const accountTypes = {
      FREE: 0,
      VIP: 0,
      SUPER: 0
    };
    
    accountTypeStats.forEach(stat => {
      // Map backend account types to frontend expected types
      const mappedType = mapAccountType(stat._id);
      if (mappedType) {
        accountTypes[mappedType] = stat.count;
      }
    });

    // Format response to match frontend expectations
    res.json({
      success: true,
      data: {
        totalUsers,
        newUsersThisMonth: monthUsers,
        freeUsers: accountTypes.FREE,
        vipUsers: accountTypes.VIP,
        superUsers: accountTypes.SUPER,
        overview: {
          totalUsers,
          activeUsers,
          inactiveUsers: totalUsers - activeUsers,
          verificationRate: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0
        },
        newUsers: {
          today: todayUsers,
          thisWeek: weekUsers,
          thisMonth: monthUsers,
          thisYear: yearUsers
        },
        accountTypes,
        recentUsers
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
});

// Get dashboard overview statistics
router.get('/overview', async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      totalUsers,
      activeUsers,
      todayUsers,
      weekUsers,
      monthUsers,
      yearUsers,
      accountTypeStats,
      recentUsers
    ] = await Promise.all([
      // Total users
      User.countDocuments(),
      
      // Active users
      User.countDocuments({ isVerified: true }),
      
      // Today's new users
      User.countDocuments({ 
        createdAt: { $gte: startOfDay } 
      }),
      
      // This week's new users
      User.countDocuments({ 
        createdAt: { $gte: startOfWeek } 
      }),
      
      // This month's new users
      User.countDocuments({ 
        createdAt: { $gte: startOfMonth } 
      }),
      
      // This year's new users
      User.countDocuments({ 
        createdAt: { $gte: startOfYear } 
      }),
      
      // Account type distribution
      User.aggregate([
        {
          $group: {
            _id: '$accountType',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Recent users (last 5)
      User.find()
        .select('fullName email accountType createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    // Format account type stats
    const accountTypes = {
      FREE: 0,
      VIP: 0,
      SUPER: 0
    };
    
    accountTypeStats.forEach(stat => {
      // Map backend account types to frontend expected types
      const mappedType = mapAccountType(stat._id);
      if (mappedType) {
        accountTypes[mappedType] = stat.count;
      }
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers,
          inactiveUsers: totalUsers - activeUsers,
          verificationRate: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0
        },
        newUsers: {
          today: todayUsers,
          thisWeek: weekUsers,
          thisMonth: monthUsers,
          thisYear: yearUsers
        },
        accountTypes,
        recentUsers
      }
    });

  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
});

// Get user growth chart data
router.get('/user-growth', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Fill in missing dates with 0 count
    const chartData = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const existingData = userGrowth.find(item => {
        const itemDate = new Date(item._id.year, item._id.month - 1, item._id.day);
        return itemDate.toISOString().split('T')[0] === dateStr;
      });
      
      chartData.push({
        date: dateStr,
        count: existingData ? existingData.count : 0
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({
      success: true,
      data: {
        period: `${days} days`,
        chartData
      }
    });

  } catch (error) {
    console.error('User growth chart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user growth data'
    });
  }
});

// Get monthly user growth chart data
router.get('/user-growth-monthly', async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - months);

    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Fill in missing months with 0 count
    const chartData = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      const existingData = userGrowth.find(item => 
        item._id.year === year && item._id.month === month
      );
      
      chartData.push({
        date: `${year}-${month.toString().padStart(2, '0')}-01`,
        count: existingData ? existingData.count : 0,
        label: currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      });
      
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    res.json({
      success: true,
      data: {
        period: `${months} months`,
        chartData
      }
    });

  } catch (error) {
    console.error('Monthly user growth chart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monthly user growth data'
    });
  }
});

// Get account type distribution
router.get('/account-distribution', async (req, res) => {
  try {
    const distribution = await User.aggregate([
      {
        $group: {
          _id: '$accountType',
          count: { $sum: 1 },
          activeCount: {
            $sum: {
              $cond: [{ $eq: ['$isVerified', true] }, 1, 0]
            }
          }
        }
      }
    ]);

    const totalUsers = await User.countDocuments();

    const formattedData = distribution.map(item => ({
      type: item._id,
      count: item.count,
      activeCount: item.activeCount,
      percentage: totalUsers > 0 ? Math.round((item.count / totalUsers) * 100) : 0
    }));

    res.json({
      success: true,
      data: {
        totalUsers,
        distribution: formattedData
      }
    });

  } catch (error) {
    console.error('Account distribution error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch account distribution'
    });
  }
});

// Get system health status
router.get('/system-health', async (req, res) => {
  try {
    const dbStatus = 'connected'; // Since we're here, DB is connected
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    // Convert bytes to MB
    const formatMemory = (bytes) => Math.round(bytes / 1024 / 1024 * 100) / 100;

    res.json({
      success: true,
      data: {
        database: {
          status: dbStatus,
          connected: true
        },
        server: {
          uptime: Math.floor(uptime),
          uptimeFormatted: formatUptime(uptime),
          memory: {
            used: formatMemory(memoryUsage.heapUsed),
            total: formatMemory(memoryUsage.heapTotal),
            external: formatMemory(memoryUsage.external),
            rss: formatMemory(memoryUsage.rss)
          }
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('System health error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system health'
    });
  }
});

// Helper function to format uptime
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

module.exports = router;
