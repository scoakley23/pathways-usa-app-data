// Text size for tutor screens. Saved on this device only.
export const TEXT_SIZE_KEY = 'pathways_text_size';

export const TEXT_SIZES = {
  normal: { label: 'Normal', className: 'text-base', px: 16 },
  large: { label: 'Large', className: 'text-lg', px: 18 },
  xlarge: { label: 'Extra large', className: 'text-xl', px: 20 },
};

export function getTextSize() {
  try {
    const v = localStorage.getItem(TEXT_SIZE_KEY);
    return TEXT_SIZES[v] ? v : 'normal';
  } catch (e) {
    return 'normal';
  }
}

export function saveTextSize(size) {
  if (!TEXT_SIZES[size]) return;
  try {
    localStorage.setItem(TEXT_SIZE_KEY, size);
  } catch (e) {
    // ignore
  }
}
