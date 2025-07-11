import Leave from "../models/Leave.js";
import Employee from "../models/Employee.js";

// Request leave
export const requestLeave = async (req, res) => {
  try {
    const {
      leaveType,
      startDate,
      endDate,
      reason
    } = req.body;

    // Find employee by user ID
    const employee = await Employee.findOne({ userId: req.user.id });
    if (!employee) {
      return res.status(404).json({ error: "Employee profile not found" });
    }

    // Calculate total days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const leaveRequest = new Leave({
      employeeId: employee._id,
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
    const employee = await Employee.findOne({ userId: req.user.id });
    if (!employee) {
      return res.status(404).json({ error: "Employee profile not found" });
    }

    const leaves = await Leave.find({ employeeId: employee._id })
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