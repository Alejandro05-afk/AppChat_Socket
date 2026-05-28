import { useState, useEffect, useRef } from "react";
import { Image, ImageProps } from "expo-image";
import { storage } from "@shared/infrastructure/appwrite/client";
import * as FileSystem from "expo-file-system";

const APPWRITE_DOMAIN = "appwrite.io";

function parseFileId(uri: string): { bucketId: string; fileId: string } | null {
  const match = uri.match(/\/buckets\/([^/]+)\/files\/([^/]+)\//);
  if (!match) return null;
  return { bucketId: match[1], fileId: match[2] };
}

function toBase64(buf: ArrayBuffer): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const bytes = new Uint8Array(buf);
  let result = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i], b = bytes[i + 1], c = bytes[i + 2];
    result += chars[a >> 2];
    result += chars[((a & 3) << 4) | (b >> 4)];
    if (i + 1 < bytes.length) result += chars[((b & 15) << 2) | (c >> 6)];
    else { result += "="; continue; }
    if (i + 2 < bytes.length) result += chars[c & 63];
    else result += "=";
  }
  return result;
}

export function AppwriteImage({ source, ...props }: ImageProps) {
  const [localUri, setLocalUri] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const uri = typeof source === "object" && source !== null && "uri" in source
      ? (source as { uri: string }).uri
      : null;

    if (!uri || !uri.includes(APPWRITE_DOMAIN)) {
      setLocalUri(null);
      return;
    }

    let cancelled = false;
    const fileId = parseFileId(uri)?.fileId ?? "img";
    const cacheDir = FileSystem.cacheDirectory + "appwrite_images/";
    const localPath = cacheDir + fileId + ".jpg";

    (async () => {
      const dirInfo = await FileSystem.getInfoAsync(cacheDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
      }

      const fileInfo = await FileSystem.getInfoAsync(localPath);
      if (fileInfo.exists) {
        if (!cancelled && mountedRef.current) setLocalUri(localPath);
        return;
      }

      const parsed = parseFileId(uri);
      if (!parsed) {
        if (!cancelled && mountedRef.current) setLocalUri(null);
        return;
      }

      try {
        const buf = await storage.getFileDownload(parsed.bucketId, parsed.fileId);
        const base64 = toBase64(buf);
        await FileSystem.writeAsStringAsync(localPath, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        if (!cancelled && mountedRef.current) setLocalUri(localPath);
      } catch {
        if (!cancelled && mountedRef.current) setLocalUri(null);
      }
    })();

    return () => { cancelled = true; };
  }, [source]);

  const src = localUri ? { uri: localUri } : source;
  return <Image source={src} {...props} />;
}
