const router = require("express").Router();
const Todo = require("../models/Todo");
const auth = require("../middleware/auth");

router.use(auth);

router.get("/", async (req, res, next) => {
  try {
    res.json(await Todo.find({ user: req.userId }).sort({ completed: 1, createdAt: -1 }));
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { title, priority, dueDate } = req.body;
    if (!title?.trim()) return res.status(400).json({ message: "Enter a task title" });
    const todo = await Todo.create({ user: req.userId, title, priority, dueDate: dueDate || null });
    res.status(201).json(todo);
  } catch (e) {
    next(e);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const allowed = ["title", "completed", "priority", "dueDate"];
    const updates = {};
    allowed.forEach((k) => req.body[k] !== undefined && (updates[k] = req.body[k]));
    if (updates.title !== undefined && !String(updates.title).trim())
      return res.status(400).json({ message: "Task title cannot be empty" });

    const todo = await Todo.findOneAndUpdate({ _id: req.params.id, user: req.userId }, updates, {
      new: true,
      runValidators: true,
    });
    if (!todo) return res.status(404).json({ message: "Task not found" });
    res.json(todo);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const todo = await Todo.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!todo) return res.status(404).json({ message: "Task not found" });
    res.json({ id: req.params.id });
  } catch (e) {
    next(e);
  }
});

module.exports = router;