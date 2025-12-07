import User from "../models/User.js";

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find(
      {},
      "name email online lastSeen"
    );

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Error loading users" });
  }
};


// 🟢 Update profile
export const updateUser = async (req, res) => {
  try {
    const userId = req.user.id; // from token
    const { name, email } = req.body;

    const updated = await User.findByIdAndUpdate(
      userId,
      { name, email },
      { new: true }
    ).select("-password");

    res.json({ success: true, user: updated });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};
