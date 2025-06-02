import multer from "multer";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/temp'); // Specify the directory to store uploaded files
    },
    filename: (req, file, cb) => {
        cb(null,file.originalname); // Append a unique suffix to the original filename
    }
});
export const upload = multer({
     storage: storage
     });