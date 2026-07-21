export interface Language {
    code: string;
    label: string;
    native: string;
}

export const LANGUAGES: Language[] = [
    { code: "en", label: "English", native: "English" },
    { code: "te", label: "Telugu", native: "తెలుగు" },
    { code: "hi", label: "Hindi", native: "हिन्दी" },
    { code: "ta", label: "Tamil", native: "தமிழ்" },
    { code: "mr", label: "Marathi", native: "मराठी" },
];

export type LanguageCode = "en" | "te" | "hi" | "ta" | "mr";
