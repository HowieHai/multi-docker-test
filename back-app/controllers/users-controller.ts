import { user } from "./../models/types";
import { Request, Response, NextFunction } from "express";
import { Error } from "../models/http-error";
import { validationResult } from "express-validator";

const User = require("../models/user");

// var DUMMY_USRS: user[] = [
//   {
//     id: "u1",
//     name: "howie",
//     email: "howie@g.com",
//     password: "test",
//   },
// ];

const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  let users;

  try {
    users = await User.find({}, "-password");
  } catch (err) {
    const error: Error = {
      code: 500,
      message: "Fetching users failed, please try again later",
    };
    return next(error);
  }

  res.json({ users: users.map((u: any) => u.toObject({ getters: true })) });
};

const signUp = async (req: Request, res: Response, next: NextFunction) => {
  // 验证输入的信息
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error: Error = {
      code: 422,
      message: "Invalid inputs passed to sign up, please check your data",
    };
    return next(error);
  }

  console.log(req.body);

  const { name, email, password } = req.body;
  let hasUser;
  try {
    hasUser = await User.findOne({ email: email });
  } catch (err) {
    const error: Error = {
      code: 500,
      message: "Signing up failed, please try again later",
    };
    return next(error);
  }

  if (hasUser) {
    const error: Error = {
      code: 422,
      message: "Could not create user, email already exists",
    };
    return next(error);
  }

  const newUser = new User({
    name,
    email,
    password,
    image: "https://cdn-icons-png.flaticon.com/512/147/147140.png",
    places: [],
  });

  try {
    await newUser.save();
  } catch (error) {
    console.log(error);
  }

  res.status(201).json({
    message: "Created user successfully!",
    user: newUser.toObject({ getters: true }),
  });
};

const login = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error: Error = {
      code: 500,
      message: "Login failed, please try again later",
    };
    return next(error);
  }

  if (!existingUser || existingUser.password !== password) {
    const error: Error = {
      code: 401,
      message: "Could not identify user, cridentials seem to be wrong!",
    };
    throw error;
  }

  res.json({ message: "Login Succesfully" });
};

exports.getUsers = getUsers;
exports.signUp = signUp;
exports.login = login;
