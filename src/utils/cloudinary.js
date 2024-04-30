import { v2 as cloudinary } from "cloudinary";
import fs from "fs";


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
})

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null

        // upload the file on cloudinary
        const responce = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })

        // file has been uploaded successfully
        console.log("File is uploaded on cloudinary", responce.url)
        fs.unlinkSync(localFilePath)
        return responce
    }
    catch (erroe) {
        fs.unlink(localFilePath)     // remove the locally saved temporary file as the upload opration got failed
        return null
    }
}

export { uploadOnCloudinary }