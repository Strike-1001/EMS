import Attendance from "../models/Attendance.js";
import User from "../models/User.js";

// Check in
export const checkIn = async (req, res) => {
  try {
    const { location } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find employee by user ID
    const employee = await User.findOne({ _id: req.user.id, role: "user" });
    if (!employee) {
      return res.status(404).json({ error: "Employee profile not found" });
    }

    // Check if already checked in today
    const existingAttendance = await Attendance.findOne({
      employeeId: employee._id,
      date: today
    });

    if (existingAttendance && existingAttendance.checkIn?.time) {
      return res.status(400).json({ error: "Already checked in today" });
    }

    let attendance;
    if (existingAttendance) {
      // Update existing record
      attendance = await Attendance.findByIdAndUpdate(
        existingAttendance._id,
        {
          checkIn: { time: new Date(), location }
        },
        { new: true }
      );
    } else {
      // Create new attendance record
      attendance = new Attendance({
        employeeId: employee._id,
        date: today,
        checkIn: { time: new Date(), location }
      });
      await attendance.save();
    }

    // Determine lateness against office start time 10:00
    const officeStart = new Date(today);
    officeStart.setHours(10, 0, 0, 0);
    const checkInTime = attendance.checkIn.time;
    let status = 'present';
    let lateMinutes = 0;
    if (checkInTime > officeStart) {
      lateMinutes = Math.round((checkInTime - officeStart) / 60000);
      status = 'late';
    }

    attendance.status = status;
    attendance.lateMinutes = lateMinutes;
    await attendance.save();

    res.status(200).json({
      success: true,
      message: "Checked in successfully",
      attendance
    });
  } catch (error) {
    console.error("Check In Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Check out
export const checkOut = async (req, res) => {
  try {
    const { location } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find employee by user ID
    const employee = await User.findOne({ _id: req.user.id, role: "user" });
    if (!employee) {
      return res.status(404).json({ error: "Employee profile not found" });
    }

    // Find today's attendance record
    const attendance = await Attendance.findOne({
      employeeId: employee._id,
      date: today
    });

    if (!attendance || !attendance.checkIn?.time) {
      return res.status(400).json({ error: "No check-in record found for today" });
    }

    if (attendance.checkOut?.time) {
      return res.status(400).json({ error: "Already checked out today" });
    }

    const checkOutTime = new Date();
    const checkInTime = attendance.checkIn.time;
    const totalHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);

    // Calculate early leave vs office end time 18:00 (6 PM)
    const officeEnd = new Date(today);
    officeEnd.setHours(18, 0, 0, 0);
    let earlyLeaveMinutes = 0;
    if (checkOutTime < officeEnd) {
      earlyLeaveMinutes = Math.round((officeEnd - checkOutTime) / 60000);
    }

    // Calculate salary deduction based on employee salary
    const employeeDoc = await User.findOne({ _id: req.user.id, role: "user" });
    const monthlySalary = employeeDoc?.salary || 0;
    // Assume 22 working days, 8 hours per day
    const perMinuteRate = monthlySalary / (22 * 8 * 60);
    const lateMinutes = attendance.lateMinutes || 0;
    const deductionAmount = Math.max(0, Math.round((lateMinutes + earlyLeaveMinutes) * perMinuteRate));

    // Update attendance record
    attendance.checkOut = { time: checkOutTime, location };
    attendance.totalHours = totalHours;
    attendance.earlyLeaveMinutes = earlyLeaveMinutes;
    attendance.deductionAmount = deductionAmount;
    await attendance.save();

    res.status(200).json({
      success: true,
      message: "Checked out successfully",
      attendance
    });
  } catch (error) {
    console.error("Check Out Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Salary summary for current month for logged-in employee
export const getSalarySummary = async (req, res) => {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const employee = await User.findOne({ _id: req.user.id, role: "user" });
    if (!employee) return res.status(404).json({ error: 'Employee profile not found' });

    const records = await Attendance.find({ employeeId: employee._id, date: { $gte: start, $lte: end } });
    const totalDeduction = records.reduce((sum, r) => sum + (r.deductionAmount || 0), 0);
    const gross = employee.salary || 0;
    const net = Math.max(0, gross - totalDeduction);

    res.status(200).json({ success: true, gross, totalDeduction, net });
  } catch (error) {
    console.error('Get Salary Summary Error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get attendance history
export const getAttendanceHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;

    let query = {};
    if (employeeId) {
      query.employeeId = employeeId;
    } else {
      // For normal users, restrict to their own employee record
      if (req.user?.role !== 'admin') {
        const employee = await User.findOne({ _id: req.user.id, role: "user" });
        if (!employee) return res.status(404).json({ error: 'Employee profile not found' });
        query.employeeId = employee._id;
      }
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(query)
      .populate('employeeId', 'firstName lastName employeeId name')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      attendance
    });
  } catch (error) {
    console.error("Get Attendance History Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get today's attendance status
export const getTodayAttendance = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find employee by user ID
    const employee = await User.findOne({ _id: req.user.id, role: "user" });
    if (!employee) {
      return res.status(404).json({ error: "Employee profile not found" });
    }

    const attendance = await Attendance.findOne({
      employeeId: employee._id,
      date: today
    });

    res.status(200).json({
      success: true,
      attendance: attendance || null
    });
  } catch (error) {
    console.error("Get Today Attendance Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get attendance statistics (admin)
export const getAttendanceStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateQuery = {};
    if (startDate && endDate) {
      dateQuery = {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    const stats = await Attendance.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const totalRecords = await Attendance.countDocuments(dateQuery);

    res.status(200).json({
      success: true,
      stats,
      totalRecords
    });
  } catch (error) {
    console.error("Get Attendance Stats Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
}; 

// Get weekly attendance data for reports (admin)
export const getWeeklyAttendanceData = async (req, res) => {
  try {
    const { weeks = 4 } = req.query;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (weeks * 7));

    const weeklyData = [];

    // Generate weekly data
    for (let i = 0; i < weeks; i++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(startDate.getDate() + (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      // Get attendance records for this week
      const weekRecords = await Attendance.find({
        date: {
          $gte: weekStart,
          $lte: weekEnd
        }
      });

      // Calculate weekly statistics
      const totalDays = 7;
      const presentDays = weekRecords.filter(record => 
        record.status === 'present' || record.status === 'late'
      ).length;
      
      const lateDays = weekRecords.filter(record => 
        record.status === 'late'
      ).length;
      
      const absentDays = weekRecords.filter(record => 
        record.status === 'absent'
      ).length;

      weeklyData.push({
        week: i + 1,
        startDate: weekStart,
        endDate: weekEnd,
        presentDays,
        lateDays,
        absentDays,
        totalDays
      });
    }

    res.status(200).json({
      success: true,
      weeklyData
    });
  } catch (error) {
    console.error("Get Weekly Attendance Data Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get all attendance records for admin management
export const getAllAttendanceForAdmin = async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 50 } = req.query;
    
    let dateQuery = {};
    if (startDate && endDate) {
      dateQuery = {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    // Get total count for pagination
    const totalRecords = await Attendance.countDocuments(dateQuery);
    
    // Get attendance records with pagination
    const attendance = await Attendance.find(dateQuery)
      .populate('employeeId', 'firstName lastName employeeId name email')
      .sort({ date: -1, 'checkIn.time': -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Calculate statistics
    const stats = await Attendance.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Format statistics
    const statsMap = {};
    stats.forEach(stat => {
      statsMap[stat._id] = stat.count;
    });

    const response = {
      success: true,
      attendance,
      stats: {
        present: statsMap.present || 0,
        late: statsMap.late || 0,
        absent: statsMap.absent || 0,
        total: totalRecords
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalRecords / parseInt(limit)),
        totalRecords,
        limit: parseInt(limit)
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Get All Attendance For Admin Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete attendance record (admin only)
export const deleteAttendanceRecord = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate attendance record exists
    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({ 
        success: false, 
        error: "Attendance record not found" 
      });
    }

    // Delete the attendance record
    await Attendance.findByIdAndDelete(id);
    
    console.log(`Attendance record ${id} deleted by admin ${req.user.id}`);
    
    res.status(200).json({
      success: true,
      message: "Attendance record deleted successfully"
    });
    
  } catch (error) {
    console.error("Delete Attendance Record Error:", error.message);
    res.status(500).json({ 
      success: false, 
      error: "Server error" 
    });
  }
}; 