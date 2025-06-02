import { v2 as cloudinary} from "cloudinary";
import fs from "fs";

cloudinary.config({ 
  cloud_name:process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (filePath) => {
  try {
    if (!filePath) return null;
    const response = await cloudinary.uploader.upload(filePath, {
      resource_type:'auto',
    });
    //file hassben uploaded successfully
    fs.unlinkSync(filePath); // Delete the file after upload

    return response;
  } catch (error) {
    fs.unlinkSync(filePath); // Delete the file 
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
}

export { uploadOnCloudinary };