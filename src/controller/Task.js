import Task from "../models/Task.js";
import Employee from "../models/Employee.js";

// Create task
export const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      assignedTo,
      priority,
      dueDate
    } = req.body;

    const task = new Task({
      title,
      description,
      assignedTo,
      assignedBy: req.user.id,
      priority: priority || 'medium',
      dueDate
    });

    await task.save();

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      task
    });
  } catch (error) {
    console.error("Create Task Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get all tasks (admin)
export const getAllTasks = async (req, res) => {
  try {
    const { status, priority } = req.query;
    let query = {};

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'firstName lastName employeeId department')
      .populate('assignedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      tasks
    });
  } catch (error) {
    console.error("Get All Tasks Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get employee's tasks
export const getEmployeeTasks = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id });
    if (!employee) {
      return res.status(404).json({ error: "Employee profile not found" });
    }

    const tasks = await Task.find({ assignedTo: employee._id })
      .populate('assignedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      tasks
    });
  } catch (error) {
    console.error("Get Employee Tasks Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Update task status
export const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, progress, comments } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    task.status = status;
    if (progress !== undefined) {
      task.progress = progress;
    }

    if (status === 'completed') {
      task.completedAt = new Date();
    }

    if (comments) {
      task.comments.push({
        user: req.user.id,
        comment: comments
      });
    }

    await task.save();

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      task
    });
  } catch (error) {
    console.error("Update Task Status Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get task by ID
export const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id)
      .populate('assignedTo', 'firstName lastName employeeId department')
      .populate('assignedBy', 'name')
      .populate('comments.user', 'name');

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.status(200).json({
      success: true,
      task
    });
  } catch (error) {
    console.error("Get Task By ID Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete task
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findByIdAndDelete(id);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.status(200).json({
      success: true,
      message: "Task deleted successfully"
    });
  } catch (error) {
    console.error("Delete Task Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get task statistics
export const getTaskStats = async (req, res) => {
  try {
    const stats = await Task.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: 'completed' });
    const pendingTasks = await Task.countDocuments({ status: 'pending' });

    res.status(200).json({
      success: true,
      stats,
      totalTasks,
      completedTasks,
      pendingTasks
    });
  } catch (error) {
    console.error("Get Task Stats Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
}; 