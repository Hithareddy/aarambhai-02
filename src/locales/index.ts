import enCommon from "./en/common.json";
import teCommon from "./te/common.json";
import hiCommon from "./hi/common.json";
import taCommon from "./ta/common.json";
import mrCommon from "./mr/common.json";

export const translations: Record<string, any> = {
    en: { common: enCommon },
    te: { common: teCommon },
    hi: { common: hiCommon },
    ta: { common: taCommon },
    mr: { common: mrCommon },
};

export type LanguageCode = "en" | "te" | "hi" | "ta" | "mr";
