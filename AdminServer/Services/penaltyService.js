const calculatePenalty = (dueDate) => {
  if (!dueDate) {
    console.error("❌ Error: No dueDate provided.");
    throw new Error("Due date is required.");
  }

  const due = new Date(dueDate);
  const today = new Date();

  if (isNaN(due.getTime())) {
    console.error(`❌ Error: Invalid date format received - ${dueDate}`);
    throw new Error("Invalid date format.");
  }

  const diffDays = Math.ceil((today - due) / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays * 10 : 0;
};

module.exports = { calculatePenalty };
