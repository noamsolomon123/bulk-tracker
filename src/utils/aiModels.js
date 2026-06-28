// Central Gemini model config — verified live against the API (June 2026).
// gemini-2.0-flash was SHUT DOWN 2026-06-01; gemini-2.5-flash is deprecated
// (retires ~2026-10-16). These are the current GA, free-tier replacements.
// REST thinking syntax is generationConfig.thinkingConfig.thinkingLevel
// (the flat "thinkingLevel" is rejected with 400).

export const GEMINI_TEXT_MODEL = 'gemini-3.1-flash-lite'; // fast, free, default minimal thinking
export const GEMINI_VISION_MODEL = 'gemini-3.5-flash'; // best free multimodal; set thinkingLevel low

export const TEXT_THINKING = 'minimal';
export const VISION_THINKING = 'low';
