const Lead = require('../models/Lead');
const Task = require('../models/Task');
const User = require('../models/User');
const Event = require('../models/Event');

const getStats = async (req, res, next) => {
  try {
    const query = {};
    if (req.user.role === 'sales' || req.user.role === 'rep') {
      query.assignedTo = req.user._id;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const meetingsQuery = {
      startTime: { $gte: today, $lte: endOfToday },
      status: { $ne: 'cancelled' }
    };
    const tasksQuery = {
      dueDate: { $gte: today, $lte: endOfToday }
    };

    if (req.user.role === 'sales' || req.user.role === 'rep') {
      meetingsQuery.assignedTo = req.user._id;
      tasksQuery.assignedTo = req.user._id;
    }

    // Execute all database queries in parallel for maximum performance
    const [
      totalLeads,
      activeDeals,
      wonDeals,
      lostDeals,
      revenueData,
      recentLeads,
      todayLeads,
      todayMeetings,
      activeDealsList,
      dealsClosingThisMonth,
      todaysTasks
    ] = await Promise.all([
      Lead.countDocuments(query),
      Lead.countDocuments({ ...query, status: { $nin: ['Won', 'Lost'] } }),
      Lead.countDocuments({ ...query, status: 'Won' }),
      Lead.countDocuments({ ...query, status: 'Lost' }),
      Lead.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalExpected: { $sum: '$expectedRevenue' },
            totalWon: {
              $sum: { $cond: [{ $eq: ['$status', 'Won'] }, '$expectedRevenue', 0] }
            }
          }
        }
      ]),
      Lead.find(query).populate('assignedTo', 'name').sort({ createdAt: -1 }).limit(5),
      Lead.find({ ...query, createdAt: { $gte: today, $lte: endOfToday } }).populate('assignedTo', 'name').sort({ createdAt: -1 }),
      Event.find(meetingsQuery).populate('assignedTo', 'name').sort({ startTime: 1 }),
      Lead.find({ ...query, status: { $nin: ['Won', 'Lost'] } }).populate('assignedTo', 'name').sort({ expectedRevenue: -1 }).limit(5),
      Lead.find({ ...query, status: { $in: ['Proposal Sent', 'Negotiation', 'Demo Scheduled'] } }).populate('assignedTo', 'name').sort({ expectedRevenue: -1 }).limit(5),
      Task.find(tasksQuery).populate('assignedTo', 'name')
    ]);

    const expectedRevenue = revenueData.length > 0 ? revenueData[0].totalExpected : 0;
    const wonRevenue = revenueData.length > 0 ? revenueData[0].totalWon : 0;
    const closedDeals = wonDeals + lostDeals;
    const conversionRate = closedDeals > 0 ? Math.round((wonDeals / closedDeals) * 100) : 0;

    res.json({
      totalLeads,
      activeDeals,
      wonDeals,
      lostDeals,
      expectedRevenue,
      wonRevenue,
      conversionRate,
      recentLeads,
      todaysTasks,
      todayLeads,
      todayMeetings,
      activeDealsList,
      dealsClosingThisMonth
    });
  } catch (error) {
    console.error('getStats dashboard error:', error);
    next(error);
  }
};

const getRevenue = async (req, res, next) => {
  try {
    const query = {};
    if (req.user.role === 'sales') {
      query.assignedTo = req.user._id;
    }

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const revenueByMonth = await Lead.aggregate([
      {
        $match: {
          ...query,
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Won'] }, '$expectedRevenue', 0]
            }
          },
          pipeline: { $sum: '$expectedRevenue' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const formattedData = revenueByMonth.map((item) => {
      const monthIndex = item._id.month - 1;
      return {
        month: `${months[monthIndex]} ${item._id.year.toString().slice(-2)}`,
        revenue: item.revenue,
        pipeline: item.pipeline
      };
    });

    const result = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthName = months[d.getMonth()] + ' ' + d.getFullYear().toString().slice(-2);
      
      const found = formattedData.find((item) => item.month === monthName);
      if (found) {
        result.push(found);
      } else {
        result.push({
          month: monthName,
          revenue: 0,
          pipeline: 0
        });
      }
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getPerformance = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      res.status(403);
      return next(new Error('Admin access only'));
    }

    const leaderboard = await Lead.aggregate([
      {
        $match: {
          assignedTo: { $ne: null }
        }
      },
      {
        $group: {
          _id: '$assignedTo',
          revenue: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Won'] }, '$expectedRevenue', 0]
            }
          },
          leadsCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'salesperson'
        }
      },
      { $unwind: '$salesperson' },
      {
        $project: {
          _id: 1,
          name: '$salesperson.name',
          email: '$salesperson.email',
          revenue: 1,
          leadsCount: 1
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    res.json(leaderboard);
  } catch (error) {
    next(error);
  }
};

const getSources = async (req, res, next) => {
  try {
    const query = {};
    if (req.user.role === 'sales') {
      query.assignedTo = req.user._id;
    }

    const sources = await Lead.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$source',
          value: { $sum: 1 }
        }
      },
      {
        $project: {
          name: '$_id',
          value: 1,
          _id: 0
        }
      }
    ]);

    res.json(sources);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
  getRevenue,
  getPerformance,
  getSources
};
