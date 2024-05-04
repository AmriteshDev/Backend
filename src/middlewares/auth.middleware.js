import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

export const varifyJWT = asyncHandler(async (req, res, next) => {

    // find the token form cookie or header (in Mobile) 
    // Decode the token using jwt
    // find the user base on decoded token id
    // add user in req

    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
        throw new ApiError(401, "Unauthorized request")
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRECT)

    const user = await User.findById(decodedToken._id).select("-password -refreshToken")

    if (!user) {
        throw new ApiError(401, "Invalid Access Token")
    }

    req.user = user
    next()
})

