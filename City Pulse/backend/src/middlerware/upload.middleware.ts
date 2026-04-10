import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { cloudinary } from "../config/cloudinary";

const storage = new CloudinaryStorage({
  cloudinary,

  params: async (req, file) => ({
    folder: "issues",
    resource_type: file.mimetype.startsWith("video") ? "video" : "image",
    public_id: `${Date.now()}-${file.originalname}`,
    transformation: [{ quality: "auto", fetch_format: "auto" }] // Part 36 Auto-optimization
  }),
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only images and videos are allowed."));
    }
  }
});
