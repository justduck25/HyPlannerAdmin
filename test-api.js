const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function testAPI() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const now = new Date();
    const months = 6;
    const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
    
    console.log('Start date:', startDate);
    console.log('End date:', now);
    
    const pipeline = [
      {
        $match: {
          createdAt: { $gte: startDate, $lte: now }
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
    ];
    
    const result = await User.aggregate(pipeline);
    console.log('Aggregation result:', JSON.stringify(result, null, 2));
    
    // Also check total users
    const totalUsers = await User.countDocuments();
    console.log('Total users:', totalUsers);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testAPI();