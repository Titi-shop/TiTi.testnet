"use client";

import { useState } from "react";

export default function UploadIconPage() {
  const [file, setFile] = useState<any>(null);
  const [url, setUrl] = useState("");

  const upload = async () => {
    if (!file) return alert("Chọn file trước");

    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/api/upload-icon", {
      method: "POST",
      body: form,
    });

    const data = await res.json();
    setUrl(data.url);
  };

  return (
    <main className="p-5">
      <h1 className="text-xl font-bold mb-3">Upload Icon Danh Mục</h1>

      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="mb-3"
      />

      <button
        onClick={upload}
        className="bg-orange-600 text-white px-4 py-2 rounded"
      >
        Upload
      </button>

      {url && (
        <div className="mt-4">
          <p>URL icon:</p>
          <code className="block bg-gray-100 p-2 rounded">{url}</code>

          <img src={url} className="w-24 h-24 mt-3 rounded-full border" />
        </div>
      )}
    </main>
  );
}
