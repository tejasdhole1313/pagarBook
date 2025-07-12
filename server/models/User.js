const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
  },
  role: {
    type: String,
    enum: ['employee', 'admin'],
    default: 'employee',
  },
  department: {
    type: String,
    trim: true,
    maxlength: [50, 'Department cannot exceed 50 characters'],
  },
  employeeId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    maxlength: [20, 'Employee ID cannot exceed 20 characters'],
  },
  position: {
    type: String,
    trim: true,
    maxlength: [50, 'Position cannot exceed 50 characters'],
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number'],
  },
  profileImageUrl: {
    type: String,
  },
  faceRegistered: {
    type: Boolean,
    default: false,
  },
  faceDataUrl: {
    type: String,
  },
  faceDescriptors: [{
    type: Array, // Array of face descriptors for face recognition
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
  },
  settings: {
    notifications: {
      type: Boolean,
      default: true,
    },
    biometricAuth: {
      type: Boolean,
      default: false,
    },
    autoLocation: {
      type: Boolean,
      default: true,
    },
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    pushNotifications: {
      type: Boolean,
      default: true,
    },
  },
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpires: {
    type: Date,
  },
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: {
    type: Date,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return this.name;
});

// Virtual for isLocked
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ employeeId: 1 });
userSchema.index({ department: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to reset login attempts on successful login
userSchema.pre('save', function(next) {
  if (this.isModified('lastLogin')) {
    this.loginAttempts = 0;
    this.lockUntil = undefined;
  }
  next();
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to increment login attempts
userSchema.methods.incLoginAttempts = async function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return await this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return await this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = async function() {
  return await this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find active users
userSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

// Static method to find by department
userSchema.statics.findByDepartment = function(department) {
  return this.find({ department, isActive: true });
};

// Static method to get attendance statistics
userSchema.statics.getAttendanceStats = async function(startDate, endDate) {
  const Attendance = mongoose.model('Attendance');
  
  return await this.aggregate([
    {
      $lookup: {
        from: 'attendances',
        localField: '_id',
        foreignField: 'userId',
        as: 'attendance'
      }
    },
    {
      $unwind: '$attendance'
    },
    {
      $match: {
        'attendance.timestamp': {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: '$department',
        totalUsers: { $sum: 1 },
        presentUsers: {
          $sum: {
            $cond: [{ $eq: ['$attendance.type', 'check-in'] }, 1, 0]
          }
        }
      }
    }
  ]);
};

// Method to get user's attendance summary
userSchema.methods.getAttendanceSummary = async function(startDate, endDate) {
  const Attendance = mongoose.model('Attendance');
  
  const attendance = await Attendance.find({
    userId: this._id,
    timestamp: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }).sort({ timestamp: 1 });
  
  const summary = {
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    lateDays: 0,
    totalHours: 0,
    averageHours: 0,
  };
  
  // Calculate summary from attendance records
  const dailyRecords = {};
  
  attendance.forEach(record => {
    const date = record.timestamp.toDateString();
    if (!dailyRecords[date]) {
      dailyRecords[date] = { checkIn: null, checkOut: null };
    }
    
    if (record.type === 'check-in') {
      dailyRecords[date].checkIn = record.timestamp;
    } else if (record.type === 'check-out') {
      dailyRecords[date].checkOut = record.timestamp;
    }
  });
  
  Object.values(dailyRecords).forEach(day => {
    summary.totalDays++;
    
    if (day.checkIn) {
      summary.presentDays++;
      
      // Check if late (after 9:00 AM)
      const workStartTime = new Date(day.checkIn);
      workStartTime.setHours(9, 0, 0, 0);
      
      if (day.checkIn > workStartTime) {
        summary.lateDays++;
      }
      
      // Calculate hours worked
      if (day.checkOut) {
        const hoursWorked = (day.checkOut - day.checkIn) / (1000 * 60 * 60);
        summary.totalHours += hoursWorked;
      }
    } else {
      summary.absentDays++;
    }
  });
  
  summary.averageHours = summary.presentDays > 0 ? summary.totalHours / summary.presentDays : 0;
  
  return summary;
};

module.exports = mongoose.model('User', userSchema); 