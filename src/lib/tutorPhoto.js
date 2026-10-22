// Learners could once use their own photo as the tutor picture, kept in this
// device's browser storage. Vía is now always the V mark, so the old photo is
// deleted once when the app loads (DeleteMyData also clears `pathways_` keys).

export const TUTOR_PHOTO_KEY = 'pathways_tutor_photo';

export function clearTutorPhoto() {
  try {
    localStorage.removeItem(TUTOR_PHOTO_KEY);
  } catch (e) {
    /* storage blocked: nothing to clear */
  }
}
