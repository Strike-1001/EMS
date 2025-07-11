import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";

// Check in
export const checkIn = async (req, res) => {
  try {
    const { location } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find employee by user ID
    const employee = await Employee.findOne({ userId: req.user.id });
    if (!employee) {
      return res.status(404).json({ error: "Employee profile not found" });
    }

    // Check if already checked in today
    const existingAttendance = await Attendance.findOne({
      employeeId: employee._id,
      date: today
    });

    if (existingAttendance && existingAttendance.checkIn.time) {
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
    const employee = await Employee.findOne({ userId: req.user.id });
    if (!employee) {
      return res.status(404).json({ error: "Employee profile not found" });
    }

    // Find today's attendance record
    const attendance = await Attendance.findOne({
      employeeId: employee._id,
      date: today
    });

    if (!attendance || !attendance.checkIn.time) {
      return res.status(400).json({ error: "No check-in record found for today" });
    }

    if (attendance.checkOut.time) {
      return res.status(400).json({ error: "Already checked out today" });
    }

    const checkOutTime = new Date();
    const checkInTime = attendance.checkIn.time;
    const totalHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);

    // Update attendance record
    attendance.checkOut = { time: checkOutTime, location };
    attendance.totalHours = totalHours;
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

// Get attendance history
export const getAttendanceHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;

    let query = {};
    if (employeeId) {
      query.employeeId = employeeId;
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(query)
      .populate('employeeId', 'firstName lastName employeeId')
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
    const employee = await Employee.findOne({ userId: req.user.id });
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