
import React from "react";
import { useState } from "react";

export default function DocumentViewer({
  url: urlProp,
  alt = "document",
  imgClass = "w-40 h-28 object-cover",
  thumbClass = "",
  showView = true,
}) {
  const [open, setOpen] = useState(false);

  const computeUrl = (u) => {
    if (!u) return null;
    if (typeof u === "string") return u;
    if (typeof u === "object") return u?.url ?? u?.secure_url ?? u?.secureUrl ?? u?.fileUrl ?? null;
    return null;
  };

  const resolvedUrl = computeUrl(urlProp);

  if (!resolvedUrl) {
    return <div className={`text-sm text-slate-500 ${thumbClass}`} aria-label={`${alt}-missing`}>Not uploaded</div>;
  }

  const isPdf = /\.pdf(\?|$)/i.test(resolvedUrl) || String(resolvedUrl).includes("application/pdf");
  const isImage = /\.(jpe?g|png|gif|bmp|webp|svg)(\?|$)/i.test(resolvedUrl);

  return (
    <div className={`flex items-start gap-3 ${thumbClass}`}>
      <div>
        {isImage ? (
          <img src={resolvedUrl} alt={alt} className={imgClass} />
        ) : (
          <div className={`flex items-center justify-center border rounded ${imgClass}`}>
            <div className="text-xs text-slate-600">{isPdf ? "PDF file" : "File"}</div>
          </div>
        )}
      </div>

      {/* View button only */}
      <div className="flex flex-col gap-2">
        {showView && (
          <button type="button" className="inline-block px-3 py-1 border rounded text-sm bg-white hover:bg-gray-50" onClick={() => setOpen(true)}>
            View
          </button>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded shadow max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-3 border-b">
              <div className="font-medium">{alt}</div>
              <button className="px-3 py-1 text-sm" onClick={() => setOpen(false)}>Close</button>
            </div>

            <div className="p-4 flex items-center justify-center">
              {isImage ? (
                <img src={resolvedUrl} alt={alt} className="max-w-full max-h-[80vh] object-contain" />
              ) : isPdf ? (
                <iframe src={resolvedUrl} title={alt} className="w-full h-[80vh] border" />
              ) : (
                <div className="p-10 text-center">Unable to preview this file.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
