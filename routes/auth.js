const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email });
const emailOk = (e) => /^\S+@\S+\.\S+$/.test(e || "");

router.post("/signup", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "Enter your name" });
    if (!emailOk(email)) return res.status(400).json({ message: "Enter a valid email address" });
    if (!password || password.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters" });

    if (await User.findOne({ email: email.toLowerCase() }))
      return res.status(409).json({ message: "An account with this email already exists" });

    const user = await User.create({ name, email, password: await bcrypt.hash(password, 10) });
    res.status(201).json({ token: sign(user._id), user: publicUser(user) });
  } catch (e) {
    next(e);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() });
    if (!user || !(await bcrypt.compare(password || "", user.password)))
      return res.status(401).json({ message: "Email or password is incorrect" });
    res.json({ token: sign(user._id), user: publicUser(user) });
  } catch (e) {
    next(e);
  }
});

router.get("/me", auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(401).json({ message: "Account not found" });
    res.json({ user: publicUser(user) });
  } catch (e) {
    next(e);
  }
});

module.exports = router;