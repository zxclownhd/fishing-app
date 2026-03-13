import { useRef, useState } from "react";
import { useI18n } from "../../client/i18n/I18nContext";
import "./PhotoUploader.css";

/**
 * Photos format:
 * - existing from DB: { id: "uuid", url: "https://...", createdAt?: "..." }
 * - new after Cloudinary upload (not saved yet): { url: "https://...", publicId: "abc/123" }
 *
 * Props:
 * - photos: array of photo objects (see above)
 * - onChange: (nextPhotos) => void
 * - max: max photos allowed (default 5 or 10, up to you)
 * - onRemove: optional async (photo) => void
 *   If provided and photo.id exists, you can call your API DELETE /photos/:id there.
 * - draftFolder: optional string, e.g. `drafts/<userId>`
 *   If provided, uploads will go to that Cloudinary folder (helps cleanup safety).
 */
export default function PhotoUploader({
  photos = [],
  onChange,
  max = 10,
  onRemove,
  draftFolder,
}) {
  const { t } = useI18n();

  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [errorText, setErrorText] = useState("");

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  const MAX_BYTES = 10 * 1024 * 1024;

  function uniqByUrl(list) {
    const out = [];
    const seen = new Set();
    for (const p of list) {
      const url = p?.url ? String(p.url).trim() : "";
      if (!url) continue;
      if (seen.has(url)) continue;
      seen.add(url);
      out.push({ ...p, url });
    }
    return out;
  }

  async function upload(files) {
    if (!cloudName || !uploadPreset) {
      setErrorText(t("photos.errors.envMissing"));
      return;
    }

    const current = Array.isArray(photos) ? photos.length : 0;
    const left = Math.max(0, max - current);

    if (left === 0) {
      setErrorText(t("photos.errors.maxReached").replace("{max}", String(max)));
      return;
    }

    const arr = Array.from(files);

    const nonImages = arr.filter((f) => !f.type?.startsWith("image/"));
    const tooBig = arr.filter(
      (f) => f.type?.startsWith("image/") && f.size > MAX_BYTES,
    );

    const picked = arr
      .filter((f) => f.type?.startsWith("image/"))
      .filter((f) => f.size <= MAX_BYTES)
      .slice(0, left);

    if (!picked.length) {
      if (nonImages.length) {
        setErrorText(t("photos.errors.onlyImages"));
        return;
      }
      if (tooBig.length) {
        setErrorText(t("photos.errors.tooLarge"));
        return;
      }
      setErrorText(t("photos.errors.nothingToUpload"));
      return;
    }

    if (arr.length > left) {
      setErrorText(
        t("photos.errors.limitReached")
          .replace("{left}", String(left))
          .replace("{max}", String(max)),
      );
    } else {
      setErrorText("");
    }

    setUploading(true);

    try {
      const uploads = picked.map(async (file) => {
        const form = new FormData();
        form.append("file", file);
        form.append("upload_preset", uploadPreset);

        if (draftFolder) {
          form.append("folder", String(draftFolder));
        }

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          { method: "POST", body: form },
        );

        if (!res.ok) throw new Error("Upload failed");

        const data = await res.json();

        if (!data.secure_url) throw new Error("No secure_url");
        if (!data.public_id) throw new Error("No public_id");

        return {
          url: data.secure_url,
          publicId: data.public_id,
        };
      });

      const settled = await Promise.allSettled(uploads);

      const uploaded = settled
        .filter((r) => r.status === "fulfilled")
        .map((r) => r.value);

      const failedCount = settled.length - uploaded.length;
      const hadFailures = failedCount > 0;

      if (!uploaded.length) {
        setErrorText(t("photos.errors.uploadFailed"));
        return;
      }

      const next = uniqByUrl([...(photos || []), ...uploaded]).slice(0, max);
      onChange(next);

      if (hadFailures) {
        setErrorText(
          `${t("photos.errors.uploadFailed")} (${failedCount}/${picked.length})`,
        );
      } else {
        setErrorText("");
      }
    } catch (e) {
      console.error(e);
      setErrorText(t("photos.errors.uploadFailed"));
    } finally {
      setUploading(false);
    }
  }

  async function onPick(e) {
    const files = e.target.files;
    try {
      if (files?.length) await upload(files);
    } finally {
      e.target.value = "";
    }
  }

  function onDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    if (uploading) return;
    const files = e.dataTransfer?.files;
    if (files?.length) upload(files);
  }

  async function removePhoto(photo, idx) {
    try {
      if (typeof onRemove === "function") {
        await onRemove(photo);
      }

      const next = (photos || []).filter((_, i) => i !== idx);
      onChange(next);
      setErrorText("");
    } catch (e) {
      console.error(e);
      setErrorText(t("photos.errors.removeFailed"));
    }
  }

  return (
    <div
      className="photo-uploader"
      style={{
        border: "1px dashed #bbb",
        borderRadius: 12,
        padding: 12,
        background: "#fafafa",
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={onDrop}
    >
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? t("photos.uploading") : t("photos.addPhotos")}
        </button>

        <div style={{ opacity: 0.75, fontSize: 13 }}>
          {t("photos.hint").includes("{max}")
            ? t("photos.hint").replace("{max}", String(max))
            : `${t("photos.hint")} ${max}`}
        </div>

        {errorText ? <div style={{ color: "crimson" }}>{errorText}</div> : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={onPick}
      />

      {(photos || []).length ? (
        <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
          {(photos || []).map((p, idx) => (
            <div
              key={`${p?.id || p?.publicId || p?.url}-${idx}`}
              className="photo-uploader__photo-row"
              style={{
                display: "grid",
                gridTemplateColumns: "var(--photo-row-columns, 80px 1fr auto)",
                gap: 10,
                alignItems: "center",
              }}
            >
              <img
                src={p.url}
                alt=""
                style={{
                  width: 80,
                  height: 60,
                  objectFit: "cover",
                  borderRadius: 10,
                  border: "1px solid #eee",
                }}
              />

              <div style={{ display: "grid", gap: 4 }}>
                <div
                  style={{
                    wordBreak: "break-word",
                    fontSize: 13,
                    opacity: 0.85,
                  }}
                >
                  {p.url}
                </div>
                <div style={{ fontSize: 12, opacity: 0.65 }}>
                  {p.id ? t("photos.saved") : t("photos.notSaved")}
                </div>
              </div>

              <button
                type="button"
                onClick={() => removePhoto(p, idx)}
                disabled={uploading}
                title={
                  p.id
                    ? t("photos.removeTitleSaved")
                    : t("photos.removeTitleLocal")
                }
                style={{ gridColumn: "var(--photo-row-button-column, auto)" }}
              >
                {t("photos.remove")}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ marginTop: 10, opacity: 0.75 }}>{t("photos.empty")}</div>
      )}
    </div>
  );
}
