const LATIN =
  /\b(?:porn(?:ography|o)?|xxx|nudes?|naked|sex|sextape|rape|rapist|f+u+c+k(?:ing|er|ed)?|motherfucker|bitch|bastard|asshole|cunt|dick|cock|slut|whore|chutiya|madarchod|madarchodh|behenchod|bhosdike|bhosdi|gaandu|gandu|randi|harami|lauda|lund|chut|lanja|dengudu|pooku|modda)\b/i;

const INDIC =
  /चूतिया|मादरचोद|बहनचोद|भोसड़ी|भोसडी|रंडी|गांड|गान्ड|लंड|हरामी|లంజ|దెంగు|పూకు|మొడ్డ/;

export function looksAbusive(text: string) {
  const softened = text
    .toLowerCase()
    .replace(/[@4]/g, "a")
    .replace(/3/g, "e")
    .replace(/1|!/g, "i")
    .replace(/0/g, "o")
    .replace(/5/g, "s")
    .replace(/[^a-z\u0900-\u097F\u0C00-\u0C7F]+/g, " ");
  return LATIN.test(softened) || INDIC.test(text);
}
