import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// console.log("ppppppppppppppppppppppppppppp", process.env.CLOUDINARY_CLOUD_NAME,
//     process.env.CLOUDINARY_API_KEY,
//     process.env.CLOUDINARY_API_SECRET)
// cloudinary.config({
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//     api_key: process.env.CLOUDINARY_API_KEY,
//     api_secret: process.env.CLOUDINARY_API_SECRET,
//     // secure: true,
// })
cloudinary.config({
    cloud_name: 'amritesh',
    api_key: '195293166685671',
    api_secret: 'y26AkgwYkC93Pu1n27yX-HbCd2o',
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
        // fs.unlinkSync(localFilePath)
        return responce
    }
    catch (error) {
        console.log("Error during file uploading....")
        fs.unlinkSync(localFilePath)     // remove the locally saved temporary file as the upload opration got failed
        return null
    }
}

export { uploadOnCloudinary }