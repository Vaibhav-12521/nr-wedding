"use client";

import { toast } from "sonner";

export function downloadZip(ids: string[]) {
  const frameName = `zip-${Date.now()}`;
  const iframe = document.createElement("iframe");
  iframe.name = frameName;
  iframe.hidden = true;
  iframe.onload = () => {
    try {
      const text = iframe.contentDocument?.body?.innerText ?? "";
      if (text) toast.error(JSON.parse(text).error ?? "The download failed.");
    } catch {  }
  };
  document.body.appendChild(iframe);

  const form = document.createElement("form");
  form.method = "POST";
  form.action = "/api/photos/zip";
  form.target = frameName;
  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "ids";
  input.value = ids.join(",");
  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();
  form.remove();
  setTimeout(() => iframe.remove(), 10 * 60 * 1000);
}

export function zipParts<T extends { id: string; size: number }>(photos: T[], maxCount: number, maxBytes: number): string[][] {
  const parts: string[][] = [];
  let cur: string[] = [];
  let bytes = 0;
  for (const p of photos) {
    if (cur.length && (cur.length >= maxCount || bytes + p.size > maxBytes)) {
      parts.push(cur);
      cur = [];
      bytes = 0;
    }
    cur.push(p.id);
    bytes += p.size;
  }
  if (cur.length) parts.push(cur);
  return parts;
}
