import { Request, Response, NextFunction } from "express";
import { Error } from "../models/http-error";
import { validationResult } from "express-validator";
import { getCoordsForAddress } from "../util/location";
import mongoose from "mongoose";

const Place = require("../models/place");
const User = require("../models/user");

// var DUMMY_PLACES: place[] = [
//   {
//     id: "p1",
//     title: "Empire State Building",
//     description: "One of the most famous sky scrapers in the world",
//     coordinates: {
//       lat: 40.7484474,
//       lon: -73.9856528011589,
//     },
//     address: "20 W 34th St., New York, NY 10001 America",
//     creator: "u1",
//   },
//   {
//     id: "p2",
//     title: "Sydney Opera House",
//     description: "One of the most famous view in Australia",
//     coordinates: {
//       lat: -33.8567844,
//       lon: 151.213108,
//     },
//     address: "Bennelong Point, Sydney NSW 2000",
//     creator: "u2",
//   },
// ];

const getPlaceById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const placeId = req.params.pid; // {pid:'p1'}

  let currentPlace;
  try {
    currentPlace = await Place.findById(placeId);
  } catch (err) {
    const error: Error = {
      code: 500,
      message: "Could not find a place for the provided id.",
    };

    return next(error);
  }

  res.json({ place: currentPlace.toObject({ getters: true }) });
};

const getPlaceByUserId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.params.uid; // {pid:'p1'}

  let places;

  // 内部查询数据
  try {
    places = await Place.find({ creator: userId });
  } catch (err) {
    const error: Error = {
      code: 500,
      message: "Fetching places failed, please try again later",
    };
    return next(error);
  }

  //查询不到数据的错误
  if (!places || places.length === 0) {
    const error: Error = {
      code: 404,
      message: "Could not find places for the provided user id",
    };
    return next(error);
  }

  res.json({ places: places.map((p: any) => p.toObject({ getters: true })) });
};

const createPlace = async (req: Request, res: Response, next: NextFunction) => {
  // 验证输入的信息
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error: Error = {
      code: 422,
      message: "Invalid inputs passed, please check your data",
    };
    // 如果有 async 在,throw就不会work,需要使用next
    return next(error);
  }

  const { title, description, address, creator } = req.body;

  let coordinates: { lat: number; lon: number } = {
    lat: 0.0,
    lon: 0.0,
  };

  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }

  const createPlace = new Place({
    title,
    description,
    coordinates,
    address,
    image:
      "https://www.google.com/maps/place/%E6%82%89%E5%B0%BC%E6%AD%8C%E5%89%A7%E9%99%A2/@-33.8567844,151.2152967,3a,75y,90t/data=!3m8!1e2!3m6!1sAF1QipM0MYy_ngQbRS4Cyqe14MB3wsEx-2L76xEpmOsQ!2e10!3e12!6shttps:%2F%2Flh5.googleusercontent.com%2Fp%2FAF1QipM0MYy_ngQbRS4Cyqe14MB3wsEx-2L76xEpmOsQ%3Dw129-h86-k-no!7i2560!8i1700!4m5!3m4!1s0x0:0x3133f8d75a1ac251!8m2!3d-33.8567844!4d151.2152967#",
    creator,
  });

  let existingUser;
  try {
    existingUser = User.findById(creator);
  } catch (err) {
    const error: Error = {
      code: 500,
      message: "Creating place faild, please try again later",
    };
    // 如果有 async 在,throw就不会work,需要使用next
    return next(error);
  }

  if (!existingUser) {
    const error: Error = {
      code: 500,
      message: "We could not find user for provided ID",
    };
    // 如果有 async 在,throw就不会work,需要使用next
    return next(error);
  }

  try {
    // 建立place和user的关系
    // await createPlace.save();
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createPlace.save({ session: sess });
    existingUser.places.push(createPlace);
    await existingUser.save({ session: sess });
    await sess.commitTransaction();
  } catch (error) {
    console.log(error);
  }

  res.status(201).json({ place: createPlace });
};

const updatePlaceById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 验证输入的信息
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error: Error = {
      code: 422,
      message: "Invalid inputs passed, please check your data",
    };
    throw error;
  }

  const { title, description } = req.body;
  const placeId = req.params.pid;

  let currentPlace;
  try {
    currentPlace = await Place.findById(placeId);
  } catch (err) {
    const error: Error = {
      code: 500,
      message: "Could not find a place for the provided id.",
    };

    return next(error);
  }

  currentPlace.title = title;
  currentPlace.description = description;

  try {
    currentPlace.save();
  } catch (err) {
    const error: Error = {
      code: 500,
      message: "Something went wrong, could not update place",
    };

    return next(error);
  }

  res.status(200).json({ place: currentPlace.toObject({ getters: true }) });
};

const deletePlace = async (req: Request, res: Response, next: NextFunction) => {
  const placeId = req.params.pid;

  let currentPlace;
  try {
    currentPlace = await Place.findById(placeId).populate("creator");
  } catch (err) {
    const error: Error = {
      code: 500,
      message: "Something went wrong, could not delete place",
    };

    return next(error);
  }

  if (!currentPlace) {
    const error: Error = {
      code: 404,
      message: "Could not find place for this id",
    };

    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await currentPlace.remove({ session: sess });
    currentPlace.creator.place.pull(currentPlace);
    await currentPlace.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error: Error = {
      code: 500,
      message: "Something went wrong, could not delete place",
    };

    return next(error);
  }

  res.status(200).json({ message: "Deleted place." });
};

exports.getPlaceById = getPlaceById;
exports.getPlaceByUserId = getPlaceByUserId;
exports.createPlace = createPlace;
exports.updatePlaceById = updatePlaceById;
exports.deletePlaceById = deletePlace;
