// Senators' official portraits (src/data/senatorPhotos.json, built by
// scripts/officeholders/build_senator_photos.py after each monthly check).
// The NAMES always come from the official list (src/data/officeholders.json);
// a photo shows only while its name still matches that list, so a new
// senator never gets the old photo.
import photoData from '../data/senatorPhotos.json';
import { getOfficialsFor } from '@/lib/officeholders';

export const SENATOR_PHOTO_DIR = '/senator-photos/';
export const SENATOR_PHOTOS = photoData;

/**
 * The learner's two senators: [{ name, src?, credit?, source? }], from the
 * state they saved in Who Represents Me? ({ state }). [] without a state or
 * for a place with no senators (D.C. and the territories).
 */
export function senatorsFor(location, { data = photoData, officials = getOfficialsFor } = {}) {
  if (!location?.state) return [];
  const o = officials({ state: location.state });
  if (!o || o.noSenators || !o.senators?.length) return [];
  const photos = data.photos[o.place] || [];
  return o.senators.map((s) => {
    const photo = photos.find((p) => p.name === s.name);
    return photo
      ? { name: s.name, src: SENATOR_PHOTO_DIR + photo.file, credit: data.credit, source: `https://bioguide.congress.gov/search/bio/${photo.bioguide}` }
      : { name: s.name };
  });
}
