const WeddingEvent = require('../models/WeddingEvents');
const User = require('../models/User');
const InvitationLetter = require('../models/InvitationLetter');
const mongoose = require('mongoose');

// Lấy thống kê tổng quan weddings
exports.getWeddingStats = async (req, res) => {
  try {
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Tổng số sự kiện
    const totalEvents = await WeddingEvent.countDocuments();

    // Sự kiện tháng này (dựa trên createdAt)
    const eventsThisMonth = await WeddingEvent.countDocuments({
      createdAt: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    });

    // Sự kiện đã hoàn thành (ngày cưới đã qua)
    const completedEvents = await WeddingEvent.countDocuments({
      timeToMarried: { $lt: currentDate }
    });

    // Tổng ngân sách
    const budgetResult = await WeddingEvent.aggregate([
      {
        $group: {
          _id: null,
          totalBudget: { $sum: "$budget" }
        }
      }
    ]);

    const totalBudget = budgetResult.length > 0 ? budgetResult[0].totalBudget : 0;

    res.json({
      success: true,
      data: {
        totalEvents,
        eventsThisMonth,
        completedEvents,
        totalBudget
      }
    });

  } catch (error) {
    console.error('Error getting wedding stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê sự kiện cưới',
      error: error.message
    });
  }
};

// Lấy danh sách weddings với pagination và filter
exports.getWeddingsList = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = 'all', // all, upcoming, completed, planning
      month = 'all',
      search = ''
    } = req.query;

    const currentDate = new Date();
    let matchConditions = {};

    // Filter theo trạng thái
    if (status !== 'all') {
      switch (status) {
        case 'upcoming':
          matchConditions.timeToMarried = { $gt: currentDate };
          break;
        case 'completed':
          matchConditions.timeToMarried = { $lt: currentDate };
          break;
        case 'planning':
          // Sự kiện đang lên kế hoạch (còn hơn 1 tháng)
          const oneMonthFromNow = new Date();
          oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
          matchConditions.timeToMarried = { $gt: oneMonthFromNow };
          break;
      }
    }

    // Filter theo tháng
    if (month !== 'all') {
      const monthNum = parseInt(month);
      const year = currentDate.getFullYear();
      const startOfMonth = new Date(year, monthNum - 1, 1);
      const endOfMonth = new Date(year, monthNum, 0);
      
      matchConditions.timeToMarried = {
        ...matchConditions.timeToMarried,
        $gte: startOfMonth,
        $lte: endOfMonth
      };
    }

    // Search theo tên cặp đôi
    if (search) {
      matchConditions.$or = [
        { brideName: { $regex: search, $options: 'i' } },
        { groomName: { $regex: search, $options: 'i' } }
      ];
    }

    // Aggregate pipeline để lấy thông tin đầy đủ
    const pipeline = [
      { $match: matchConditions },
      {
        $lookup: {
          from: 'users',
          localField: 'creatorId',
          foreignField: '_id',
          as: 'creator'
        }
      },
      {
        $lookup: {
          from: 'invitationLetters',
          localField: 'creatorId',
          foreignField: 'userId',
          as: 'invitationInfo'
        }
      },
      {
        $addFields: {
          creator: { $arrayElemAt: ['$creator', 0] },
          invitationInfo: { $arrayElemAt: ['$invitationInfo', 0] },
          status: {
            $cond: {
              if: { $lt: ['$timeToMarried', currentDate] },
              then: 'ĐÃ HOÀN THÀNH',
              else: {
                $cond: {
                  if: { 
                    $lt: [
                      '$timeToMarried', 
                      { $add: [currentDate, 30 * 24 * 60 * 60 * 1000] } // 30 ngày
                    ]
                  },
                  then: 'SẮP DIỄN RA',
                  else: 'ĐANG LÊN KẾ HOẠCH'
                }
              }
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          brideName: 1,
          groomName: 1,
          budget: 1,
          timeToMarried: 1,
          createdAt: 1,
          status: 1,
          'creator.fullName': 1,
          'creator.email': 1,
          'creator.accountType': 1,
          'invitationInfo.events': 1,
          memberCount: { $size: '$member' }
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: (parseInt(page) - 1) * parseInt(limit) },
      { $limit: parseInt(limit) }
    ];

    const weddings = await WeddingEvent.aggregate(pipeline);
    
    // Đếm tổng số documents cho pagination
    const totalCountPipeline = [
      { $match: matchConditions },
      { $count: "total" }
    ];
    const totalResult = await WeddingEvent.aggregate(totalCountPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    // Format dữ liệu để hiển thị như trong hình
    const formattedWeddings = weddings.map(wedding => {
      // Lấy địa điểm từ invitation events
      let location = '-';
      if (wedding.invitationInfo && wedding.invitationInfo.events && wedding.invitationInfo.events.length > 0) {
        location = wedding.invitationInfo.events[0].eventLocation;
      }

      return {
        id: wedding._id,
        coupleName: `${wedding.groomName} & ${wedding.brideName}`,
        weddingDate: wedding.timeToMarried,
        location: location,
        budget: wedding.budget,
        status: wedding.status,
        createdAt: wedding.createdAt,
        creator: wedding.creator,
        memberCount: wedding.memberCount
      };
    });

    res.json({
      success: true,
      data: {
        weddings: formattedWeddings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error getting weddings list:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách sự kiện cưới',
      error: error.message
    });
  }
};

// Lấy chi tiết một wedding event
exports.getWeddingDetail = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID sự kiện không hợp lệ'
      });
    }

    const wedding = await WeddingEvent.findById(id)
      .populate('creatorId', 'fullName email accountType picture')
      .populate('member', 'fullName email picture')
      .populate('phases')
      .populate('groupActivities');

    if (!wedding) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sự kiện cưới'
      });
    }

    // Lấy thông tin invitation letter
    const invitationLetter = await InvitationLetter.findOne({ userId: wedding.creatorId._id });

    res.json({
      success: true,
      data: {
        wedding,
        invitationLetter
      }
    });

  } catch (error) {
    console.error('Error getting wedding detail:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy chi tiết sự kiện cưới',
      error: error.message
    });
  }
};

// Xóa wedding event
exports.deleteWedding = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID sự kiện không hợp lệ'
      });
    }

    const wedding = await WeddingEvent.findById(id);
    if (!wedding) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sự kiện cưới'
      });
    }

    await WeddingEvent.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Đã xóa sự kiện cưới thành công'
    });

  } catch (error) {
    console.error('Error deleting wedding:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa sự kiện cưới',
      error: error.message
    });
  }
};
