// src/config/cloudinary.js
export const CLOUDINARY = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
  defaultFolder: import.meta.env.VITE_CLOUDINARY_FOLDER || "Walton",
};

export const cloudinaryEndpoint = (resourceType = "auto") =>
  `https://api.cloudinary.com/v1_1/${CLOUDINARY.cloudName}/${resourceType}/upload`;