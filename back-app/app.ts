import express from "express";
import bodyParser from "body-parser";
import { Request, Response, NextFunction } from "express";
import { Error } from "./models/http-error";
import mongoose from "mongoose";

const app = express();
const PORT = 5001;
const placeRoutes = require("./routes/places-routes");
const userRoutes = require("./routes/users-routes");

app.use(bodyParser.json());

app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE");

  next();
});

app.use("/api/places", placeRoutes);
app.use("/api/users", userRoutes);

// 这里每一个app.use 都是按照顺序在走的
app.use((req, res, next) => {
  const error: Error = {
    message: "Could not find this route.",
    code: 404,
  };
  throw error;
});

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res
    .status(error.code || 500)
    .json({ message: error.message || "An unknown error occurred!" });
});

mongoose
  .connect("mongodb://mongo/fullsta")
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server Running Well! http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });

// Mongo 创建： docker run -d --name mymongo -p 27017:27017 -v mongodbdata:/data/db mongo
