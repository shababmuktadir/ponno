// src/services/cloudinary/cloudinaryService.js
import { CLOUDINARY, cloudinaryEndpoint } from "@/config/cloudinary";

const MAX_IMAGE_MB = 8;
const MAX_VIDEO_MB = 60;

export function validateFile(file, kind = "image") {
  if (!file) throw new Error("ফাইল নির্বাচন করা হয়নি।");
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");

  if (kind === "image" && !isImage)
    throw new Error("শুধুমাত্র ছবি আপলোড করা যাবে।");
  if (kind === "video" && !isVideo)
    throw new Error("শুধুমাত্র ভিডিও আপলোড করা যাবে।");

  const mb = file.size / (1024 * 1024);
  const limit = kind === "video" ? MAX_VIDEO_MB : MAX_IMAGE_MB;
  if (mb > limit) throw new Error(`ফাইলের আকার ${limit}MB এর কম হতে হবে।`);

  return true;
}

/**
 * Unsigned upload — safe for browser. No API secret involved.
 * Returns only metadata; never store binaries in Firestore.
 */
export function uploadToCloudinary(file, { folder, kind = "image", onProgress } = {}) {
  validateFile(file, kind);
  const resourceType = kind === "video" ? "video" : "image";

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", CLOUDINARY.uploadPreset);
  form.append("folder", folder || CLOUDINARY.defaultFolder);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", cloudinaryEndpoint(resourceType), true);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        return reject(new Error("আপলোড ব্যর্থ হয়েছে। আবার চেষ্টা করুন।"));
      }
      let res;
      try {
        res = JSON.parse(xhr.responseText);
      } catch {
        return reject(new Error("আপলোড প্রতিক্রিয়া পড়া যায়নি।"));
      }
      resolve({
        url: res.url,
        secureUrl: res.secure_url,
        publicId: res.public_id,
        thumbnailUrl:
          res.resource_type === "video"
            ? String(res.secure_url).replace(/\.\w+$/, ".jpg")
            : String(res.secure_url).replace(
                "/upload/",
                "/upload/c_fill,w_400,h_400,q_auto,f_auto/"
              ),
        resourceType: res.resource_type,
        format: res.format,
        bytes: res.bytes,
        width: res.width,
        height: res.height,
        duration: res.duration,
        createdAt: res.created_at,
      });
    };

    xhr.onerror = () => reject(new Error("নেটওয়ার্ক সমস্যা — আপলোড ব্যর্থ।"));
    xhr.send(form);
  });
}