import express from "express";
import { check } from "express-validator";

const userController = require("../controllers/users-controller");

const router = express.Router();

router.get("/", userController.getUsers);

router.post(
  "/signup",
  [
    check("name").notEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  userController.signUp
);

router.post("/login", userController.login);

module.exports = router;
