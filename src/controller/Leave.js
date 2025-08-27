import Leave from "../models/Leave.js";
import User from "../models/User.js";

// Request leave
export const requestLeave = async (req, res) => {
  try {
    const {
      leaveType = 'sick', // Default to sick leave
      startDate,
      endDate,
      reason
    } = req.body;

    // Find user by ID (user is now the employee)
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'user') {
      return res.status(404).json({ error: "Employee profile not found" });
    }

    // Calculate total days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const leaveRequest = new Leave({
      employeeId: user._id,
      leaveType,
      startDate: start,
      endDate: end,
      totalDays,
      reason
    });

    await leaveRequest.save();

    res.status(201).json({
      success: true,
      message: "Leave request submitted successfully",
      leave: leaveRequest
    });
  } catch (error) {
    console.error("Request Leave Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get all leave requests (admin)
export const getAllLeaveRequests = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    
    if (status) {
      query.status = status;
    }

    const leaves = await Leave.find(query)
      .populate('employeeId', 'firstName lastName employeeId department')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      leaves
    });
  } catch (error) {
    console.error("Get Leave Requests Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get employee's leave history
export const getEmployeeLeaveHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'user') {
      return res.status(404).json({ error: "Employee profile not found" });
    }

    const leaves = await Leave.find({ employeeId: user._id })
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      leaves
    });
  } catch (error) {
    console.error("Get Employee Leave History Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Approve/reject leave request (admin)
export const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;

    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({ error: "Leave request not found" });
    }

    leave.status = status;
    leave.approvedBy = req.user.id;
    leave.approvedAt = new Date();
    if (comments) {
      leave.comments = comments;
    }

    await leave.save();

    res.status(200).json({
      success: true,
      message: `Leave request ${status} successfully`,
      leave
    });
  } catch (error) {
    console.error("Update Leave Status Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get leave statistics (admin)
export const getLeaveStats = async (req, res) => {
  try {
    const stats = await Leave.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const totalRequests = await Leave.countDocuments();
    const pendingRequests = await Leave.countDocuments({ status: 'pending' });

    res.status(200).json({
      success: true,
      stats,
      totalRequests,
      pendingRequests
    });
  } catch (error) {
    console.error("Get Leave Stats Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get leave analysis data for reports (admin)
export const getLeaveAnalysisData = async (req, res) => {
  try {
    // Get leave type breakdown
    const leaveTypeStats = await Leave.aggregate([
      {
        $group: {
          _id: "$leaveType",
          count: { $sum: 1 },
          totalDays: { $sum: "$totalDays" }
        }
      }
    ]);

    // Get monthly leave trends for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyTrends = await Leave.aggregate([
      {
        $match: {
          startDate: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$startDate" },
            month: { $month: "$startDate" }
          },
          count: { $sum: 1 },
          totalDays: { $sum: "$totalDays" }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);

    // Get status breakdown
    const statusStats = await Leave.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Get department-wise leave distribution
    const departmentStats = await Leave.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "employeeId",
          foreignField: "_id",
          as: "employee"
        }
      },
      {
        $unwind: "$employee"
      },
      {
        $group: {
          _id: "$employee.department",
          count: { $sum: 1 },
          totalDays: { $sum: "$totalDays" }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      leaveTypeStats,
      monthlyTrends,
      statusStats,
      departmentStats
    });
  } catch (error) {
    console.error("Get Leave Analysis Data Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete leave record (admin only)
export const deleteLeaveRecord = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate leave record exists
    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({ 
        success: false, 
        error: "Leave record not found" 
      });
    }

    // Delete the leave record
    await Leave.findByIdAndDelete(id);
    
    console.log(`Leave record ${id} deleted by admin ${req.user.id}`);
    
    res.status(200).json({
      success: true,
      message: "Leave record deleted successfully"
    });
    
  } catch (error) {
    console.error("Delete Leave Record Error:", error.message);
    res.status(500).json({ 
      success: false, 
      error: "Server error" 
    });
  }
}; 