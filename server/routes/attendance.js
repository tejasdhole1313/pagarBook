const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { verifyFace } = require('../utils/faceRecognition');
const { sendNotification } = require('../utils/notificationService');

// Validation middleware
const validateMarkAttendance = [
  body('type').isIn(['check-in', 'check-out']).withMessage('Type must be either check-in or check-out'),
  body('faceData').notEmpty().withMessage('Face data is required'),
  body('location.latitude').optional().isFloat().withMessage('Latitude must be a valid number'),
  body('location.longitude').optional().isFloat().withMessage('Longitude must be a valid number'),
];

// Mark attendance
router.post('/mark', validateMarkAttendance, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { type, faceData, location } = req.body;
    const userId = req.user.userId;

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found',
      });
    }

    // Check if user has registered face
    if (!user.faceRegistered) {
      return res.status(400).json({
        error: 'Face not registered',
        message: 'Please register your face before marking attendance',
      });
    }

    // Verify face (in production, implement actual face verification)
    const faceVerification = await verifyFace(faceData, user.faceDescriptors);
    if (!faceVerification.verified) {
      return res.status(400).json({
        error: 'Face verification failed',
        message: 'Face verification failed. Please try again.',
      });
    }

    // Check if attendance already marked for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAttendance = await Attendance.findOne({
      userId,
      type,
      timestamp: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    if (existingAttendance) {
      return res.status(400).json({
        error: 'Attendance already marked',
        message: `${type === 'check-in' ? 'Check-in' : 'Check-out'} already marked for today`,
      });
    }

    // Create attendance record
    const attendance = new Attendance({
      userId,
      userName: user.name,
      type,
      timestamp: new Date(),
      location,
      faceVerified: true,
      confidence: faceVerification.confidence,
      imageUrl: faceVerification.imageUrl,
    });

    await attendance.save();

    // Send notification to admin (if configured)
    if (user.settings.notifications) {
      await sendNotification({
        userId: user._id,
        title: 'Attendance Marked',
        message: `${user.name} has marked ${type === 'check-in' ? 'check-in' : 'check-out'} at ${new Date().toLocaleTimeString()}`,
        type: 'attendance',
      });
    }

    res.status(201).json({
      message: 'Attendance marked successfully',
      attendance: {
        id: attendance._id,
        type: attendance.type,
        timestamp: attendance.timestamp,
        location: attendance.location,
        faceVerified: attendance.faceVerified,
        confidence: attendance.confidence,
      },
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({
      error: 'Attendance marking failed',
      message: 'An error occurred while marking attendance',
    });
  }
});

// Get attendance history
router.get('/history', async (req, res) => {
  try {
    const { startDate, endDate, userId: queryUserId } = req.query;
    const currentUserId = req.user.userId;
    const isAdmin = req.user.role === 'admin';

    // Only admins can view other users' attendance
    const targetUserId = isAdmin && queryUserId ? queryUserId : currentUserId;

    const filter = { userId: targetUserId };

    if (startDate && endDate) {
      filter.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const attendance = await Attendance.find(filter)
      .sort({ timestamp: -1 })
      .limit(100);

    res.json(attendance);
  } catch (error) {
    console.error('Get attendance history error:', error);
    res.status(500).json({
      error: 'Failed to fetch attendance history',
      message: 'An error occurred while fetching attendance history',
    });
  }
});

// Get today's attendance
router.get('/today', async (req, res) => {
  try {
    const userId = req.user.userId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await Attendance.findOne({
      userId,
      type: 'check-in',
      timestamp: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    res.json(todayAttendance);
  } catch (error) {
    console.error('Get today attendance error:', error);
    res.status(500).json({
      error: 'Failed to fetch today\'s attendance',
      message: 'An error occurred while fetching today\'s attendance',
    });
  }
});

// Get attendance statistics
router.get('/stats', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const userId = req.user.userId;
    const isAdmin = req.user.role === 'admin';

    let startDate, endDate;
    const now = new Date();

    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
    }

    endDate = now;

    const filter = { timestamp: { $gte: startDate, $lte: endDate } };
    
    if (!isAdmin) {
      filter.userId = userId;
    }

    const stats = await Attendance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            type: '$type',
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.date',
          checkIns: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'check-in'] }, '$count', 0],
            },
          },
          checkOuts: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'check-out'] }, '$count', 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      period,
      startDate,
      endDate,
      stats,
    });
  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch attendance statistics',
      message: 'An error occurred while fetching attendance statistics',
    });
  }
});

// Generate attendance report
router.post('/report', async (req, res) => {
  try {
    const { startDate, endDate, department, userId } = req.body;
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only administrators can generate reports',
      });
    }

    const filter = {
      timestamp: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };

    if (department) {
      const usersInDepartment = await User.find({ department }).select('_id');
      filter.userId = { $in: usersInDepartment.map(u => u._id) };
    }

    if (userId) {
      filter.userId = userId;
    }

    const report = await Attendance.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $group: {
          _id: {
            userId: '$userId',
            userName: '$user.name',
            department: '$user.department',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          },
          checkIn: {
            $min: {
              $cond: [{ $eq: ['$type', 'check-in'] }, '$timestamp', null],
            },
          },
          checkOut: {
            $max: {
              $cond: [{ $eq: ['$type', 'check-out'] }, '$timestamp', null],
            },
          },
          hoursWorked: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$type', 'check-out'] }, { $ne: ['$checkIn', null] }] },
                { $divide: [{ $subtract: ['$timestamp', '$checkIn'] }, 1000 * 60 * 60] },
                0,
              ],
            },
          },
        },
      },
      {
        $group: {
          _id: {
            userId: '$_id.userId',
            userName: '$_id.userName',
            department: '$_id.department',
          },
          totalDays: { $sum: 1 },
          totalHours: { $sum: '$hoursWorked' },
          averageHours: { $avg: '$hoursWorked' },
          lateDays: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$checkIn', null] },
                    { $gt: ['$checkIn', { $add: ['$checkIn', 9 * 60 * 60 * 1000] }] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { '_id.userName': 1 } },
    ]);

    res.json({
      startDate,
      endDate,
      department,
      report,
    });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({
      error: 'Failed to generate report',
      message: 'An error occurred while generating the report',
    });
  }
});

// Verify face
router.post('/verify-face', async (req, res) => {
  try {
    const { faceData } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user || !user.faceRegistered) {
      return res.status(400).json({
        error: 'Face not registered',
        message: 'Face not registered for this user',
      });
    }

    const verification = await verifyFace(faceData, user.faceDescriptors);
    
    res.json({
      verified: verification.verified,
      confidence: verification.confidence,
      message: verification.verified ? 'Face verified successfully' : 'Face verification failed',
    });
  } catch (error) {
    console.error('Face verification error:', error);
    res.status(500).json({
      error: 'Face verification failed',
      message: 'An error occurred during face verification',
    });
  }
});

// Get attendance by date
router.get('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const userId = req.user.userId;
    const isAdmin = req.user.role === 'admin';

    const targetDate = new Date(date);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const filter = {
      timestamp: {
        $gte: targetDate,
        $lt: nextDate,
      },
    };

    if (!isAdmin) {
      filter.userId = userId;
    }

    const attendance = await Attendance.find(filter)
      .populate('userId', 'name email department')
      .sort({ timestamp: 1 });

    res.json(attendance);
  } catch (error) {
    console.error('Get attendance by date error:', error);
    res.status(500).json({
      error: 'Failed to fetch attendance for date',
      message: 'An error occurred while fetching attendance for the specified date',
    });
  }
});

// Update attendance (admin only)
router.put('/:attendanceId', async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { type, timestamp, location } = req.body;
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only administrators can update attendance records',
      });
    }

    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({
        error: 'Attendance not found',
        message: 'Attendance record not found',
      });
    }

    const updates = {};
    if (type) updates.type = type;
    if (timestamp) updates.timestamp = new Date(timestamp);
    if (location) updates.location = location;

    const updatedAttendance = await Attendance.findByIdAndUpdate(
      attendanceId,
      updates,
      { new: true }
    );

    res.json({
      message: 'Attendance updated successfully',
      attendance: updatedAttendance,
    });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({
      error: 'Failed to update attendance',
      message: 'An error occurred while updating attendance',
    });
  }
});

// Delete attendance (admin only)
router.delete('/:attendanceId', async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only administrators can delete attendance records',
      });
    }

    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({
        error: 'Attendance not found',
        message: 'Attendance record not found',
      });
    }

    await Attendance.findByIdAndDelete(attendanceId);

    res.json({
      message: 'Attendance deleted successfully',
    });
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({
      error: 'Failed to delete attendance',
      message: 'An error occurred while deleting attendance',
    });
  }
});

module.exports = router; 