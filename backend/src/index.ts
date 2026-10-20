import express from "express";
import { configDotenv } from "dotenv"
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";

configDotenv();

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use(cookieParser());

app.use("api/v1/auth", authRoutes);
app.use("api/v1/profile", profileRoutes);

app.listen(port, () => {
    console.log(`Server is running at port: ${port}`);
});

app.get("/", (req, res) => {
  res.send({
    message: "Relay"
  })
});