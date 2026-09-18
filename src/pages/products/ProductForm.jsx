import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  X, Save, Package, Upload, Image as ImageIcon, Check,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/utils/errors";
import { uploadToCloudinary } from "@/services/cloudinary/cloudinaryService";
import usePackage from "@/hooks/usePackage";
import useUsage from "@/hooks/useUsage";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { cn } from "@/utils/cn";

export default function ProductForm({
  workspaceId,
  categories = [],
  initial = null,
  onSave,
  onClose,
}) {
  const { profile } = useAuth();
  const { hasFeature } = usePackage();
  const { canUse: canAddImage, used: imageUsed, limit: imageLimit, unlimited: imageUnlimited } =
    useUsage("products", "productLimit"); // uses product limits; image limit checked separately

  const imageEnabled = hasFeature("product", "image");
  const imagePerProductLimit = useMemo(() => {
    // find in product page features
    return null; // computed by caller via getLimit if needed
  }, []);

  const [form, setForm] = useState({
    name: "",
    categoryId: "",
    categoryNameSnapshot: "",
    model: "",
    buyUnitPrice: "",
    sellUnitPrice: "",
    currentStock: "",
    openingStock: "",
    description: "",
    sku: "",
    barcode: "",
    supplier: "",
    image: null,
    images: [],
  });

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name || "",
        categoryId: initial.categoryId || "",
        categoryNameSnapshot: initial.categoryNameSnapshot || "",
        model: initial.model || "",
        buyUnitPrice: initial.buyUnitPrice ?? "",
        sellUnitPrice: initial.sellUnitPrice ?? "",
        currentStock: initial.currentStock ?? "",
        openingStock: initial.openingStock ?? "",
        description: initial.description || "",
        sku: initial.sku || "",
        barcode: initial.barcode || "",
        supplier: initial.supplier || "",
        image: initial.image || null,
        images: initial.images || [],
      });
    }
  }, [initial]);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleImage = async (file) => {
    if (!file) return;
    if (!imageEnabled) {
      toast.error("আপনার প্যাকেজে প্রোডাক্ট ছবি নেই");
      return;
    }
    if (!file.type.startsWith("image/")) {
      return toast.error("শুধু ছবি নির্বাচন করুন");
    }
    if (file.size > 4 * 1024 * 1024) {
      return toast.error("ছবি ৪MB এর কম হতে হবে");
    }

    setUploading(true);
    try {
      const meta = await uploadToCloudinary(file, {
        kind: "image",
        folder: `Walton/products`,
      });
      update("image", {
        secureUrl: meta.secureUrl,
        url: meta.url,
        publicId: meta.publicId,
        thumbnailUrl: meta.thumbnailUrl,
        resourceType: "image",
      });
      toast.success("ছবি আপলোড হয়েছে");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("নাম দিন");
    if (Number(form.buyUnitPrice) < 0 || Number(form.sellUnitPrice) < 0)
      return toast.error("মূল্য সঠিক নয়");
    if (Number(form.currentStock) < 0)
      return toast.error("স্টক সঠিক নয়");

    const cat = categories.find((c) => c.id === form.categoryId);

    setSaving(true);
    try {
      await onSave({
        name: form.name.trim(),
        categoryId: form.categoryId || null,
        categoryNameSnapshot: cat?.name || "",
        model: form.model.trim(),
        buyUnitPrice: Number(form.buyUnitPrice) || 0,
        sellUnitPrice: Number(form.sellUnitPrice) || 0,
        currentStock: Number(form.currentStock) || 0,
        openingStock:
          Number(form.openingStock) ||
          Number(form.currentStock) ||
          0,
        description: form.description.trim(),
        sku: form.sku.trim(),
        barcode: form.barcode.trim(),
        supplier: form.supplier.trim(),
        image: form.image,
      });
      onClose?.();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Image */}
      {imageEnabled && (
        <div>
          <p className="mb-2 text-[13px] font-medium text-ink">প্রোডাক্ট ছবি</p>
          {form.image ? (
            <div className="relative inline-block">
              <img
                src={form.image.secureUrl || form.image.url}
                alt="product"
                className="h-24 w-24 rounded-[12px] border border-line object-cover"
              />
              <button
                type="button"
                onClick={() => update("image", null)}
                className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-danger text-white shadow-md"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-[12px] border-2 border-dashed border-line bg-surface/50 text-muted transition-colors hover:border-accent-strong hover:text-ink">
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
                onChange={(e) => handleImage(e.target.files?.[0])}
              />
            </label>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="নাম"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          required
        />
        <Input
          label="মডেল"
          value={form.model}
          onChange={(e) => update("model", e.target.value)}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-ink">
            ক্যাটাগরি
          </label>
          <select
            value={form.categoryId}
            onChange={(e) => update("categoryId", e.target.value)}
            className="h-11 w-full rounded-[12px] border border-line bg-surface/70 px-3 text-sm text-ink focus:border-accent-strong/70 focus:outline-none"
          >
            <option value="">নির্বাচন করুন</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <Input
          label="SKU"
          value={form.sku}
          onChange={(e) => update("sku", e.target.value)}
          disabled={!hasFeature("product", "sku")}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="ক্রয় মূল্য (৳)"
          type="number"
          min="0"
          value={form.buyUnitPrice}
          onChange={(e) => update("buyUnitPrice", e.target.value)}
          disabled={!hasFeature("product", "purchasePrice")}
        />
        <Input
          label="বিক্রয় মূল্য (৳)"
          type="number"
          min="0"
          value={form.sellUnitPrice}
          onChange={(e) => update("sellUnitPrice", e.target.value)}
          disabled={!hasFeature("product", "sellingPrice")}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="বর্তমান স্টক"
          type="number"
          min="0"
          value={form.currentStock}
          onChange={(e) => update("currentStock", e.target.value)}
        />
        <Input
          label="বিবরণ"
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          disabled={!hasFeature("product", "description")}
        />
      </div>

      {hasFeature("product", "supplier") && (
        <Input
          label="সাপ্লায়ার"
          value={form.supplier}
          onChange={(e) => update("supplier", e.target.value)}
        />
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          বাতিল
        </Button>
        <Button type="submit" loading={saving} disabled={uploading}>
          <Save className="h-4 w-4" />
          {initial ? "আপডেট" : "তৈরি করুন"}
        </Button>
      </div>
    </form>
  );
}