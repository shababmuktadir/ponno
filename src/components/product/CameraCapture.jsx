import { useState } from "react";
import { Camera, Image as ImageIcon, Upload, X } from "lucide-react";
import toast from "react-hot-toast";
import { uploadToCloudinary } from "@/services/cloudinary/cloudinaryService";
import { requestCameraPermission, requestPhotosPermission, isNative } from "@/services/native/permissionsService";
import { cn } from "@/utils/cn";

/**
 * Dual-source image picker:
 *  - Native APK: Capacitor Camera plugin (camera + gallery)
 *  - Web: HTML file input
 */
export default function CameraCapture({
  value,
  onChange,
  folder = "Walton/products",
  disabled = false,
}) {
  const [uploading, setUploading] = useState(false);

  const handleNativeCapture = async (source) => {
    const camera = window.Capacitor?.Plugins?.Camera;
    if (!camera) {
      toast.error("Native camera not available");
      return;
    }

    try {
      if (source === "camera") {
        await requestCameraPermission();
      } else {
        await requestPhotosPermission();
      }

      const photo = await camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: "base64",
        source: source === "camera" ? "CAMERA" : "PHOTOS",
        width: 1200,
        correctOrientation: true,
      });

      if (!photo.base64String) {
        toast.error("ছবি পাওয়া যায়নি");
        return;
      }

      // Convert base64 → File
      const byteString = atob(photo.base64String);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: `image/${photo.format || "jpeg"}` });
      const file = new File([blob], `photo.${photo.format || "jpeg"}`, {
        type: `image/${photo.format || "jpeg"}`,
      });

      await uploadFile(file);
    } catch (err) {
      if (err?.message !== "User cancelled photos app") {
        toast.error(err.message || "ছবি নিতে সমস্যা");
      }
    }
  };

  const uploadFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("শুধু ছবি নির্বাচন করুন");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error("ছবি ৪MB এর কম হতে হবে");
      return;
    }

    setUploading(true);
    try {
      const meta = await uploadToCloudinary(file, { kind: "image", folder });
      onChange?.({
        secureUrl: meta.secureUrl,
        url: meta.url,
        publicId: meta.publicId,
        thumbnailUrl: meta.thumbnailUrl,
        resourceType: "image",
      });
      toast.success("ছবি আপলোড হয়েছে");
    } catch (err) {
      toast.error(err.message || "আপলোড ব্যর্থ");
    } finally {
      setUploading(false);
    }
  };

  const handleWebFile = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative inline-block">
          <img
            src={value.thumbnailUrl || value.secureUrl || value.url}
            alt="preview"
            className="h-24 w-24 rounded-[12px] border border-line object-cover"
          />
          <button
            type="button"
            onClick={() => onChange?.(null)}
            disabled={disabled || uploading}
            className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-danger text-white shadow-md disabled:opacity-50"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          {isNative() ? (
            <>
              <button
                type="button"
                onClick={() => handleNativeCapture("camera")}
                disabled={disabled || uploading}
                className={cn(
                  "flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-[12px] border-2 border-dashed border-line bg-surface/50 text-muted transition-colors",
                  "hover:border-accent-strong hover:text-ink disabled:opacity-50"
                )}
              >
                {uploading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <>
                    <Camera className="h-4 w-4" />
                    <span className="text-[10px]">ক্যামেরা</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleNativeCapture("gallery")}
                disabled={disabled || uploading}
                className={cn(
                  "flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-[12px] border-2 border-dashed border-line bg-surface/50 text-muted transition-colors",
                  "hover:border-accent-strong hover:text-ink disabled:opacity-50"
                )}
              >
                {uploading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4" />
                    <span className="text-[10px]">গ্যালারি</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <label
              className={cn(
                "flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-[12px] border-2 border-dashed border-line bg-surface/50 text-muted transition-colors",
                "hover:border-accent-strong hover:text-ink",
                (disabled || uploading) && "pointer-events-none opacity-50"
              )}
            >
              {uploading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span className="text-[10px]">আপলোড</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleWebFile}
                disabled={disabled || uploading}
              />
            </label>
          )}
        </div>
      )}
    </div>
  );
}