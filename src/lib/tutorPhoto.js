// The learner's own tutor picture. It stays on this device only (never
// uploaded: Base44 can't delete uploaded files). DeleteMyData clears it with
// the other `pathways_` keys. Components listen for EVENT to update.

export const TUTOR_PHOTO_KEY = 'pathways_tutor_photo';
export const TUTOR_PHOTO_EVENT = 'pathways-tutor-photo';
export const TUTOR_PHOTO_SIZE = 384;

export function loadTutorPhoto() {
  try {
    const v = localStorage.getItem(TUTOR_PHOTO_KEY);
    return v && v.startsWith('data:image/') ? v : null;
  } catch (e) {
    return null;
  }
}

// Returns false when the device won't store it (full or blocked storage).
export function saveTutorPhoto(dataUrl) {
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) return false;
  try {
    localStorage.setItem(TUTOR_PHOTO_KEY, dataUrl);
  } catch (e) {
    return false;
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(TUTOR_PHOTO_EVENT));
  return true;
}

// The centered square of an image, as [sx, sy, side].
export function centerSquare(width, height) {
  const side = Math.min(width, height);
  return [Math.round((width - side) / 2), Math.round((height - side) / 2), side];
}

// Crops a picked file to a centered square and shrinks it, so it is small
// enough for browser storage. Resolves to a JPEG data URL.
export function resizePhoto(file, size = TUTOR_PHOTO_SIZE) {
  return new Promise((resolve, reject) => {
    if (!file || !/^image\//.test(file.type)) { reject(new Error('not an image')); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const [sx, sy, side] = centerSquare(img.naturalWidth, img.naturalHeight);
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      canvas.getContext('2d').drawImage(img, sx, sy, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('could not read image')); };
    img.src = url;
  });
}
