import { Router } from "express";
import { changeCurrentPassword, getCurrentUser, logOutUser, loginUser, refreshAccessToken, registerUser, updateAccountDetails, updateCoverImage, updateUserAvatar } from "../controllers/registerUser.controller.js";
import { uploadMulter } from "../middlewares/multer.middleware.js";
import { varifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()


router.route("/register").post(
    uploadMulter.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)


// secured routes
router.route("/logout").post(varifyJWT, logOutUser)
router.route("refresh-token").post(refreshAccessToken)
router.route("/change-password").post(varifyJWT, changeCurrentPassword)
router.route("/current-user").get(varifyJWT, getCurrentUser)
router.route("/update-account").patch(varifyJWT, updateAccountDetails)

router.route("/avatar").patch(varifyJWT, uploadMulter.single("avatar"), updateUserAvatar)
router.route("/cover-image").patch(varifyJWT, uploadMulter.single("coverImage"), updateCoverImage)

export default router