import User from "../models/User.js";

// Create new employee (admin only)
export const createEmployee = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      contact,
      phone,
      department,
      position,
      hireDate,
      salary,
      address
    } = req.body;

    // Check if employee already exists
    const existingEmployee = await User.findOne({ email });
    if (existingEmployee) {
      return res.status(409).json({ error: "Employee with this email already exists" });
    }

    // Generate employee ID
    const employeeId = `EMP${Date.now()}`;

    // Create user with employee details
    const newEmployee = new User({
      name: `${firstName} ${lastName}`,
      email,
      contact,
      password: "defaultPassword123", // Should be changed on first login
      role: "user",
      employeeId,
      firstName,
      lastName,
      phone,
      department,
      position,
      hireDate,
      salary,
      address,
      status: "active"
    });

    await newEmployee.save();

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      employee: newEmployee
    });
  } catch (error) {
    console.error("Create Employee Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get all employees (admin only)
export const getAllEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: "user" })
      .select('-password') // Don't send password
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      employees
    });
  } catch (error) {
    console.error("Get Employees Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get employee by ID
export const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await User.findOne({ _id: id, role: "user" })
      .select('-password');

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.status(200).json({
      success: true,
      employee
    });
  } catch (error) {
    console.error("Get Employee Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Update employee
export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Don't allow role change through this endpoint
    delete updateData.role;
    delete updateData.password;

    const employee = await User.findOneAndUpdate(
      { _id: id, role: "user" },
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      employee
    });
  } catch (error) {
    console.error("Update Employee Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete employee
export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await User.findOneAndDelete({ _id: id, role: "user" });

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.status(200).json({
      success: true,
      message: "Employee deleted successfully"
    });
  } catch (error) {
    console.error("Delete Employee Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get employee dashboard data
export const getEmployeeDashboard = async (req, res) => {
  try {
    const employee = await User.findById(req.user.id)
      .select('-password');

    if (!employee || employee.role !== "user") {
      return res.status(404).json({ error: "Employee profile not found" });
    }

    res.status(200).json({
      success: true,
      employee
    });
  } catch (error) {
    console.error("Get Employee Dashboard Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
}; 