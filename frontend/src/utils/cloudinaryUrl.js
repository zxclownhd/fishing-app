// src/utils/cloudinaryUrl.js
export function getCloudinaryVariant(
  url,
  {
    w,
    h,
    crop = "fill", // fill, fit, pad
    gravity, // auto, face, center, ...
    quality = "auto",
    format = "auto",
    dpr, // auto or number
  } = {}
) {
  if (!url || typeof url !== "string") return url;

  const marker = "/upload/";
  const i = url.indexOf(marker);
  if (i === -1) return url; // not a Cloudinary URL

  const prefix = url.slice(0, i + marker.length);
  const rest = url.slice(i + marker.length);

  // If URL already has transformations (very rough check), don't double insert
  // Example: /upload/w_400,h_300/... already
  if (rest.startsWith("w_") || rest.startsWith("c_") || rest.startsWith("q_") || rest.startsWith("f_")) {
    return url;
  }

  const parts = [];

  if (w) parts.push(`w_${Number(w)}`);
  if (h) parts.push(`h_${Number(h)}`);
  if (crop) parts.push(`c_${crop}`);
  if (gravity) parts.push(`g_${gravity}`);

  // performance defaults
  if (quality) parts.push(`q_${quality}`);
  if (format) parts.push(`f_${format}`);
  if (dpr) parts.push(`dpr_${dpr}`);

  const tr = parts.join(",");

  return `${prefix}${tr}/${rest}`;
}