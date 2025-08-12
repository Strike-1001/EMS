import Task from "../models/Task.js";
import User from "../models/User.js";

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

    // Validate required fields
    if (!title || !description || !assignedTo || !dueDate) {
      return res.status(400).json({ 
        error: "Missing required fields: title, description, assignedTo, dueDate" 
      });
    }

    // Check if the assigned user exists and is an employee
    const user = await User.findById(assignedTo);
    if (!user || user.role !== 'user') {
      return res.status(404).json({ 
        error: "Employee not found with the provided assignedTo ID" 
      });
    }

    const task = new Task({
      title,
      description,
      assignedTo,
      assignedBy: req.user.id,
      priority: priority || 'medium',
      dueDate: new Date(dueDate)
    });

    await task.save();

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      task
    });
  } catch (error) {
    console.error("Create Task Error:", error.message);
    console.error("Full error:", error);
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
      .populate('assignedBy', 'name email')
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
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'user') {
      return res.status(404).json({ error: "Employee profile not found" });
    }

    const tasks = await Task.find({ assignedTo: user._id })
      .populate('assignedBy', 'name email')
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

// Update task (admin only)
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData.assignedBy;
    delete updateData._id;

    const task = await Task.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('assignedTo', 'firstName lastName employeeId department')
    .populate('assignedBy', 'name email');

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      task
    });
  } catch (error) {
    console.error("Update Task Error:", error.message);
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
      .populate('assignedBy', 'name email')
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