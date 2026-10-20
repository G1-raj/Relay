import express from "express";
import { configDotenv } from "dotenv"

configDotenv();

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());

app.listen(port, () => {
    console.log(`Server is running at port: ${port}`);
});

app.get("/", (req, res) => {
  res.send({
    message: "Relay"
  })
});