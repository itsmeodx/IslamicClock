/**
 * Converts a string to Arabic numerals if language is 'ar'.
 * Gregorian dates always stay Western.
 * @param {string|number} str
 * @param {string} language
 * @returns {string}
 */
export function localizeNumbers(str, language) {
  if (language !== "ar") return String(str);

  const arabicNumerals = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(str).replace(/[0-9]/g, (w) => arabicNumerals[w]);
}

/**
 * Returns Western numerals regardless of language.
 * Useful for ensuring Gregorian dates stay in standard format.
 */
export function westernNumbers(str) {
  return String(str);
}
