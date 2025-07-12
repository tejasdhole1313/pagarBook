const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true,
  },
  userName: {
    type: String,
    required: [true, 'User name is required'],
  },
  type: {
    type: String,
    enum: ['check-in', 'check-out'],
    required: [true, 'Attendance type is required'],
  },
  timestamp: {
    type: Date,
    required: [true, 'Timestamp is required'],
    default: Date.now,
    index: true,
  },
  location: {
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
    },
    address: {
      type: String,
      trim: true,
    },
  },
  faceVerified: {
    type: Boolean,
    default: false,
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0,
  },
  imageUrl: {
    type: String,
  },
  deviceInfo: {
    deviceId: {
      type: String,
      trim: true,
    },
    deviceModel: {
      type: String,
      trim: true,
    },
    osVersion: {
      type: String,
      trim: true,
    },
    appVersion: {
      type: String,
      trim: true,
    },
  },
  ipAddress: {
    type: String,
    trim: true,
  },
  userAgent: {
    type: String,
    trim: true,
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
  },
  isLate: {
    type: Boolean,
    default: false,
  },
  isEarlyLeave: {
    type: Boolean,
    default: false,
  },
  hoursWorked: {
    type: Number,
    min: 0,
    default: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'modified'],
    default: 'approved',
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: {
    type: Date,
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: [200, 'Rejection reason cannot exceed 200 characters'],
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual for formatted timestamp
attendanceSchema.virtual('formattedTimestamp').get(function() {
  return this.timestamp.toLocaleString();
});

// Virtual for date only
attendanceSchema.virtual('date').get(function() {
  return this.timestamp.toDateString();
});

// Virtual for time only
attendanceSchema.virtual('time').get(function() {
  return this.timestamp.toLocaleTimeString();
});

// Virtual for day of week
attendanceSchema.virtual('dayOfWeek').get(function() {
  return this.timestamp.toLocaleDateString('en-US', { weekday: 'long' });
});

// Indexes for better query performance
attendanceSchema.index({ userId: 1, timestamp: -1 });
attendanceSchema.index({ type: 1, timestamp: -1 });
attendanceSchema.index({ faceVerified: 1 });
attendanceSchema.index({ status: 1 });
attendanceSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });

// Compound index for date range queries
attendanceSchema.index({ userId: 1, timestamp: 1 });

// Pre-save middleware to calculate late/early status
attendanceSchema.pre('save', function(next) {
  if (this.isModified('timestamp') || this.isNew) {
    const workStartTime = new Date(this.timestamp);
    workStartTime.setHours(9, 0, 0, 0); // 9:00 AM

    const workEndTime = new Date(this.timestamp);
    workEndTime.setHours(17, 0, 0, 0); // 5:00 PM

    if (this.type === 'check-in') {
      this.isLate = this.timestamp > workStartTime;
    } else if (this.type === 'check-out') {
      this.isEarlyLeave = this.timestamp < workEndTime;
    }
  }
  next();
});

// Static method to get attendance by date range
attendanceSchema.statics.getByDateRange = function(userId, startDate, endDate) {
  return this.find({
    userId,
    timestamp: {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    },
  }).sort({ timestamp: 1 });
};

// Static method to get today's attendance
attendanceSchema.statics.getTodayAttendance = function(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return this.find({
    userId,
    timestamp: {
      $gte: today,
      $lt: tomorrow,
    },
  }).sort({ timestamp: 1 });
};

// Static method to get attendance statistics
attendanceSchema.statics.getStats = async function(userId, startDate, endDate) {
  const stats = await this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        timestamp: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      },
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          type: '$type',
        },
        count: { $sum: 1 },
        lateCount: { $sum: { $cond: ['$isLate', 1, 0] } },
        earlyLeaveCount: { $sum: { $cond: ['$isEarlyLeave', 1, 0] } },
        totalHours: { $sum: '$hoursWorked' },
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
        lateDays: {
          $sum: {
            $cond: [{ $eq: ['$_id.type', 'check-in'] }, '$lateCount', 0],
          },
        },
        earlyLeaves: {
          $sum: {
            $cond: [{ $eq: ['$_id.type', 'check-out'] }, '$earlyLeaveCount', 0],
          },
        },
        totalHours: { $sum: '$totalHours' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return stats;
};

// Static method to get department attendance
attendanceSchema.statics.getDepartmentAttendance = async function(department, date) {
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);

  return await this.aggregate([
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
      $match: {
        'user.department': department,
        timestamp: {
          $gte: startDate,
          $lt: endDate,
        },
      },
    },
    {
      $group: {
        _id: '$userId',
        userName: { $first: '$user.name' },
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
        isLate: {
          $max: {
            $cond: [{ $eq: ['$type', 'check-in'] }, '$isLate', false],
          },
        },
        isEarlyLeave: {
          $max: {
            $cond: [{ $eq: ['$type', 'check-out'] }, '$isEarlyLeave', false],
          },
        },
      },
    },
    { $sort: { userName: 1 } },
  ]);
};

// Instance method to calculate hours worked
attendanceSchema.methods.calculateHoursWorked = function() {
  if (this.type === 'check-out') {
    // This would need to be called with the corresponding check-in record
    return 0;
  }
  return 0;
};

// Instance method to check if attendance is valid
attendanceSchema.methods.isValid = function() {
  return this.faceVerified && this.confidence >= 0.8;
};

// Instance method to get attendance status
attendanceSchema.methods.getStatus = function() {
  if (this.status === 'rejected') {
    return 'Rejected';
  }
  if (this.status === 'pending') {
    return 'Pending Approval';
  }
  if (this.status === 'modified') {
    return 'Modified';
  }
  
  if (this.type === 'check-in') {
    return this.isLate ? 'Late Check-in' : 'On Time';
  } else {
    return this.isEarlyLeave ? 'Early Leave' : 'Regular Check-out';
  }
};

module.exports = mongoose.model('Attendance', attendanceSchema); 