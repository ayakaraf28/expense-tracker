//تهيئة البكج الرئيسيات للمشروع express,cors,pg,dotenv
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const app = express();
const port = 3000;
app.use(express.json());
app.use(cors());

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD),
  database: process.env.DB_NAME,
});
//ارجاع كل المصاريف----------------------------
app.get("/api/expenses", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM expenses");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Something went wrong" });
  }
});
//إرجاع مصروف محدد عن طريق id---------------------------------------
app.get("/api/expenses/:id", async (req, res) => {
  const { id } = req.params;
  //للتشييك انه تم ادخال ال id كرقم
  if (isNaN(id)) {
    return res.status(400).json({ error: "Please enter a number for ID" });
  }
  try {
    const result = await pool.query("SELECT * FROM expenses WHERE id= $1", [id,]);
    //بحال كان id مش موجود متل id=50
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Sorry, this ID is not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});
//إضافة مصروف جديد------------------------------------
app.post("/api/expenses", async (req, res) => {
  const { title, amount, category, date } = req.body;
  if (!title) {
    return res.status(400).json({ error: "You must enter a title" });
  }
  try {
    const text =
      "INSERT INTO expenses(title,amount,category,date) values($1,$2,$3,$4) RETURNING *";
    const values = [title, amount, category || "General", date || new Date()];
    const result = await pool.query(text, values);
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Something went wrong" });
  }
});
//تعديل على مصروف معين عن طريق id------------------------------------
app.put("/api/expenses/:id", async (req, res) => {
  const { id } = req.params;
  const { title, amount, category, date } = req.body;
  //للتشييك انه تم ادخال ال id كرقم
  if (isNaN(id)) {
    return res.status(400).json({ error: "Please enter a number for ID" });
  }
  try {
    const text = `
    UPDATE expenses SET 
    title=COALESCE($1,title),
    amount=COALESCE($2,amount),
    category = COALESCE($3, category),
    date = COALESCE($4, date)
    WHERE id=$5 RETURNING *;
    `;

    const values = [
      title || null,
      amount || null,
      category || null,
      date || null,
      id,
    ];
    const result = await pool.query(text, values);
    //بحال دخلت id مش موجود
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Sorry, this ID is not found" });
    }
    return res.json({
      message: "Expense updated successfully",
      updatedExpense: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: "Something went wrong" });
  }
});
//حذف مصروف عن طريق id------------------------------
app.delete("/api/expenses/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM expenses WHERE id=$1 RETURNING *",
      [id],
    );
    //اتحقق اذا العنصر الي بدي احذفه موجود أو لأ
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Sorry, this ID is not found" });
    }
    return res.json({
      message: "Expense deleted successfully",
      deletedExpense: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: "Something went wrong" });
  }
});
console.log("TESTING SERVER");
//تشغيل server---------
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});