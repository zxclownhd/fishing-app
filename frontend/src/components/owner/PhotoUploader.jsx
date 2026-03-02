import { useRef, useState } from "react";

export default function PhotoUploader({ urls, onChange, max = 10 }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [errorText, setErrorText] = useState("");

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  const MAX_BYTES = 10 * 1024 * 1024;

  async function upload(files) {
    if (!cloudName || !uploadPreset) {
      setErrorText("Cloudinary env is missing");
      return;
    }

    const current = urls?.length || 0;
    const left = Math.max(0, max - current);

    if (left === 0) {
      setErrorText(`Max ${max} photos reached`);
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
        setErrorText("Only images are allowed");
        return;
      }
      if (tooBig.length) {
        setErrorText("Some images are too large (max 10MB)");
        return;
      }
      setErrorText("Nothing to upload");
      return;
    }

    // якщо юзер вибрав більше, ніж можна додати, покажемо норм підказку
    if (arr.length > left) {
      setErrorText(`Only ${left} more photo(s) can be added (max ${max})`);
    } else {
      setErrorText("");
    }

    setUploading(true);

    try {
      const uploaded = [];
      for (const file of picked) {
        const form = new FormData();
        form.append("file", file);
        form.append("upload_preset", uploadPreset);

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          { method: "POST", body: form },
        );

        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        if (!data.secure_url) throw new Error("No secure_url");

        uploaded.push(data.secure_url);
      }

      onChange([...(urls || []), ...uploaded]);

      // прибрати підказку після успіху
      setErrorText("");
    } catch (e) {
      console.error(e);
      setErrorText("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function onPick(e) {
    const files = e.target.files;
    if (files?.length) upload(files);
    e.target.value = "";
  }

  function onDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    if (uploading) return;
    const files = e.dataTransfer?.files;
    if (files?.length) upload(files);
  }

  function removeAt(idx) {
    onChange((urls || []).filter((_, i) => i !== idx));
    setErrorText("");
  }

  return (
    <div
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
          {uploading ? "Uploading..." : "Add photos"}
        </button>

        <div style={{ opacity: 0.75, fontSize: 13 }}>
          Drag and drop images here. Max {max}. Up to 10MB each.
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

      {(urls || []).length ? (
        <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
          {(urls || []).map((u, idx) => (
            <div
              key={`${u}-${idx}`}
              style={{
                display: "grid",
                gridTemplateColumns: "80px 1fr auto",
                gap: 10,
                alignItems: "center",
              }}
            >
              <img
                src={u}
                alt=""
                style={{
                  width: 80,
                  height: 60,
                  objectFit: "cover",
                  borderRadius: 10,
                  border: "1px solid #eee",
                }}
              />
              <div
                style={{ wordBreak: "break-word", fontSize: 13, opacity: 0.85 }}
              >
                {u}
              </div>
              <button
                type="button"
                onClick={() => removeAt(idx)}
                disabled={uploading}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ marginTop: 10, opacity: 0.75 }}>No photos yet</div>
      )}
    </div>
  );
}