import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponce } from "../utils/ApiResponce.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import jwt from "jsonwebtoken";


const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken

        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation - not empty (email, username, fullnmame....)
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object- create entry in db
    // remove password and refresh token field from responce
    // check for user creation
    // return res

    const { username, email, fullName, password, } = req.body
    console.log(req.body)
    if (
        [fullName, email, username, password].some((field) => {
            field?.trim() === ""
        })
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = User.findOne({
        $or: [{ email }, { username }]
    })

    if (!existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalpath = req.files?.coverImage[0]?.path

    let coverImageLocalpath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalpath = req.files.coverImage[0].path
    }


    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalpath)


    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullName,
        email,
        password,
        username: (username ? username.toLowerCase() : ""),
        avatar: avatar.url,
        coverImage: coverImage.url || "",
    })

    const createUser = await User.findById(user._id).select("-password -refreshToken")

    if (!createUser) {
        throw new ApiError(500, "Something went worng while registering the user")
    }

    return res.status(201).json(
        new ApiResponce(200, createUser, "User Registered Successfully")
    )
})

const loginUser = asyncHandler(async (req, res) => {
    // req body =>data(userName, email, passward)
    // check for empty
    // FInd the user
    // check for password (match)
    // generate access and refresh token
    // send cookie, store in cookie and send responce

    const { email, username, password } = req.body

    if (!email && !username) {
        throw new ApiError(400, "Username and email is required")
    }
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(400, "User not found")
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password)

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid user credentials")
    }

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponce(200, {
                user: loggedInUser, accessToken, refreshToken
            },
                "User logged in Successfully"
            )
        )

})

const logOutUser = asyncHandler(async (req, res) => {
    // find the user (LOGGED IN) from req.user
    // set the refreshToken undefine
    // clear the cookies

    await User.findByIdAndUpdate(req.user._id,
        {
            $set: {
                refreshToken: undefined
            },

        },
        {
            new: true
        })
    const options = {
        httpOnly: true,
        secure: true
    }
    res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponce(200, {}, "User logged Out Successfully "))
})


const refreshAccessToken = asyncHandler(async (req, res) => {

    // find the incoming refresh token from cookie || body
    // check for token - if not Unauthorized request
    // decode refresh token using jwt
    // find the user from decoded token (_id)
    // check for user -  if not Invalid refresh token
    // check incoming refresh token and database stored refresh token same - if not Refresh Token is expired or used
    // generate access and refressh token
    // return res ---- set cookie for access and refresh token

    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRECT)

        const user = await User.findById(decodedToken._id)

        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh Token is expired or used")
        }
        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

        res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponce(200, { accessToken, refreshToken }, "Access token refreshed")
            )


    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    // take the old and new password from body
    // check old password not empty
    // find the logged in user --- using req.user._id
    // check oldpassword entered is currect
    // add new password in user password field
    // save the user/
    // return responce

    const { oldPassword, newPassword } = req.body

    if (!oldPassword) {
        throw new ApiError(400, "Old Password can not be empty")
    }

    const user = await User.findById(req.user._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword

    await user.save({ validateBeforeSave: false })

    res.status(200)
        .json(new ApiResponce(
            200,
            {},
            "Password Changed Successfully!"
        ))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    // user is logged in so direclty send res ------- req.user
    return res.status(200)
        .json(
            new ApiResponce(200, req.user, "User fetched successfully")
        )
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    // take the data from body
    // check for data 
    // find user and update
    // return the responces ----user

    const { fullName, email } = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = User.findByIdAndUpdate(req.user._id, {
        $set: {
            fullName: fullName,
            email: email
        }

    },
        {
            new: true
        }
    ).select("-password - refreshToken")

    return res.status(200)
        .json(new ApiResponce(200, user, "Account details update successfully"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {

    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }
    // TODO deled old image
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading avatar")
    }

    const user = User.findByIdAndUpdate(req.user._id, {
        $set: {
            avatar: avatar.url
        }
    }, { new: true }).select("-password -refreshToken")

    return res.status(200)
        .json(new ApiResponce(200, user, "Avatar updated successfully"))

})

const updateCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalpath = req.file?.path

    if (!coverImageLocalpath) {
        throw new ApiError(400, "Cover Image is required")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalpath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while updating cover image")
    }

    const user = await User.findByIdAndUpdate(req.user._id, {
        $set: {
            coverImage: coverImage.url
        }
    }, { new: true }).select("-password -refreshToken")

    return res.status(200)
        .json(new ApiResponce(200, user, "Cover Image updated successfully"))
})

export {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateCoverImage,
}