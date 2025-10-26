import express from "express";
import cors from "cors";
import { generate } from "./chatbot.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

app.post("/chat", async (req, res) => {
  const { message } = req.body;

  const result = await generate(message);
  res.json({ message: result });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
