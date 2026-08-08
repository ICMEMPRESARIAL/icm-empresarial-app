export const uploadLimits = {
  document: 25 * 1024 * 1024,
  image: 10 * 1024 * 1024,
  video: 100 * 1024 * 1024
} as const;

export const allowedUploadMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime"
] as const;

export function formatFileSize(bytes: number) {
  const mb = bytes / 1024 / 1024;
  return `${Math.round(mb)} MB`;
}

export function validateUploadFile(file: File) {
  const type = file.type;
  const maxSize = type.startsWith("video/")
    ? uploadLimits.video
    : type.startsWith("image/")
      ? uploadLimits.image
      : uploadLimits.document;

  if (!(allowedUploadMimeTypes as readonly string[]).includes(type)) {
    return "Formato no permitido. Usá PDF, imagen, video MP4/MOV o documento Word.";
  }

  if (file.size > maxSize) {
    return `El archivo supera el límite de ${formatFileSize(maxSize)}.`;
  }

  return null;
}
