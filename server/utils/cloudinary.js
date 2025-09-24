// utils/cloudinary.js
const cloudinaryLib = require("cloudinary").v2;
const fs = require("fs");
const streamifier = require("streamifier");

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
  cloudinaryLib.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });
} else {
  console.warn(
    "Cloudinary env vars missing. File upload/remove will be disabled until proper configuration is provided."
  );
}

function normalizeUploadResult(res) {
  if (!res) return null;
  const url = res?.secure_url ?? res?.url ?? null;
  const secure_url = res?.secure_url ?? res?.url ?? null;
  const public_id = res?.public_id ?? res?.publicId ?? null;
  return { url, secure_url, public_id, raw: res };
}

// ---------- File Path Upload (disk-based, local dev) ----------
async function _doUpload(filePath, opts = {}) {
  const res = await cloudinaryLib.uploader.upload(filePath, opts);

  // Remove local file after successful upload
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (e) {
    console.warn("Failed to remove local file after upload:", e?.message || e);
  }

  return normalizeUploadResult(res);
}

async function uploadToCloudinary(filePath, optionsOrFolder = {}) {
  if (!cloudinaryLib?.uploader?.upload) {
    throw new Error("Cloudinary uploader is not configured.");
  }
  if (!filePath) throw new Error("uploadToCloudinary: filePath is required");

  let opts = {};
  if (typeof optionsOrFolder === "string") {
    opts = { folder: optionsOrFolder };
  } else if (typeof optionsOrFolder === "object" && optionsOrFolder !== null) {
    opts = { ...optionsOrFolder };
  }

  try {
    return await _doUpload(filePath, opts);
  } catch (err) {
    const msg = String(err?.message || err).toLowerCase();
    if (msg.includes("invalid transformation")) {
      console.warn("Cloudinary upload: invalid transformation — retrying without transformation.");
      delete opts.transformation;
      try {
        return await _doUpload(filePath, opts);
      } catch (err2) {
        const e = new Error("Cloudinary upload failed (retry without transformation also failed).");
        e.raw = err2;
        throw e;
      }
    }
    const e = new Error(err?.message ?? "Cloudinary upload failed");
    e.raw = err;
    throw e;
  }
}

// ---------- Buffer Upload (memory-based, Vercel safe) ----------
async function uploadBufferToCloudinary(buffer, optionsOrFolder = {}) {
  if (!cloudinaryLib?.uploader?.upload_stream) {
    throw new Error("Cloudinary uploader is not configured.");
  }
  if (!buffer) throw new Error("uploadBufferToCloudinary: buffer is required");

  let opts = {};
  if (typeof optionsOrFolder === "string") {
    opts = { folder: optionsOrFolder };
  } else if (typeof optionsOrFolder === "object" && optionsOrFolder !== null) {
    opts = { ...optionsOrFolder };
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinaryLib.uploader.upload_stream(opts, (err, result) => {
      if (err) return reject(err);
      resolve(normalizeUploadResult(result));
    });

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

// ---------- Remove from Cloudinary ----------
async function removeFromCloudinary(publicIdOrUrlOrDoc) {
  if (!publicIdOrUrlOrDoc) return null;

  let publicId = null;

  if (typeof publicIdOrUrlOrDoc === "string") {
    const maybe = publicIdOrUrlOrDoc;
    if (!maybe.includes("http") && !maybe.includes("/")) {
      publicId = maybe;
    } else {
      try {
        const parts = maybe.split("/").filter(Boolean);
        const last = parts[parts.length - 1];
        publicId = last?.split(".").slice(0, -1).join(".") || last;
      } catch (e) {
        publicId = null;
      }
    }
  } else if (typeof publicIdOrUrlOrDoc === "object") {
    publicId = publicIdOrUrlOrDoc?.public_id ?? publicIdOrUrlOrDoc?.id ?? null;
    if (!publicId) {
      const candidate =
        publicIdOrUrlOrDoc?.url ??
        publicIdOrUrlOrDoc?.secure_url ??
        publicIdOrUrlOrDoc?.raw?.url;
      if (candidate) {
        try {
          const parts = String(candidate).split("/").filter(Boolean);
          const last = parts[parts.length - 1];
          publicId = last?.split(".").slice(0, -1).join(".") || last;
        } catch (e) {
          publicId = null;
        }
      }
    }
  }

  if (!publicId) {
    console.warn("removeFromCloudinary: could not determine public_id from input:", publicIdOrUrlOrDoc);
    return null;
  }

  if (!cloudinaryLib?.uploader?.destroy) {
    console.warn("removeFromCloudinary: cloudinary.uploader.destroy is not available.");
    return null;
  }

  try {
    const res = await cloudinaryLib.uploader.destroy(publicId);
    return res || null;
  } catch (err) {
    console.warn("removeFromCloudinary: error destroying cloudinary asset:", err?.message || err);
    return null;
  }
}

// ---------- Exports ----------
module.exports = {
  cloudinary: cloudinaryLib,
  uploadToCloudinary,       // path-based (local dev)
  uploadBufferToCloudinary, // buffer-based (Vercel safe)
  removeFromCloudinary,
};
