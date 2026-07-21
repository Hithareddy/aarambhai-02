import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { translations, LanguageCode } from "@/locales";
import { getLearnerProfile } from "@/lib/api/learner";

interface LanguageContextType {
    websiteLanguage: LanguageCode;
    targetLanguage: LanguageCode;
    setWebsiteLanguage: (lang: LanguageCode) => void;
    setTargetLanguage: (lang: LanguageCode) => void;
    t: (key: string, replacements?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [websiteLanguage, setWebsiteLangState] = useState<LanguageCode>(() => {
        if (typeof window !== "undefined") {
            return (localStorage.getItem("website_language") as LanguageCode) || "en";
        }
        return "en";
    });

    const [targetLanguage, setTargetLangState] = useState<LanguageCode>(() => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("target_language") || localStorage.getItem("learning_language");
            return (stored as LanguageCode) || "en";
        }
        return "en";
    });

    // Sync with backend profile as the source of truth once loaded
    useEffect(() => {
        let active = true;
        async function syncWithBackend() {
            try {
                const profile = await getLearnerProfile();
                if (profile && active) {
                    if (profile.website_language) {
                        setWebsiteLangState(profile.website_language as LanguageCode);
                        localStorage.setItem("website_language", profile.website_language);
                    }
                    if (profile.learning_language) {
                        setTargetLangState(profile.learning_language as LanguageCode);
                        localStorage.setItem("target_language", profile.learning_language);
                        localStorage.setItem("learning_language", profile.learning_language);
                    }
                }
            } catch (err) {
                // Ignore, likely not logged in or onboarding not completed yet
            }
        }
        syncWithBackend();
        return () => {
            active = false;
        };
    }, []);

    const setWebsiteLanguage = useCallback((lang: LanguageCode) => {
        setWebsiteLangState(lang);
        if (typeof window !== "undefined") {
            localStorage.setItem("website_language", lang);
        }
    }, []);

    const setTargetLanguage = useCallback((lang: LanguageCode) => {
        setTargetLangState(lang);
        if (typeof window !== "undefined") {
            localStorage.setItem("target_language", lang);
            localStorage.setItem("learning_language", lang); // Keep learning_language synced for backward compatibility
        }
    }, []);

    const t = useCallback((key: string, replacements?: Record<string, string>) => {
        const lang = websiteLanguage;
        const dictionary = translations[lang] || translations["en"];

        // Resolve namespace (prefix "common." if no namespace is provided)
        const fullKey = key.includes(".") ? (key.startsWith("common.") ? key : `common.${key}`) : `common.${key}`;
        const parts = fullKey.split(".");
        let current = dictionary;
        for (const part of parts) {
            if (current == null) break;
            current = current[part];
        }

        let result = typeof current === "string" ? current : "";

        // Fallback to English if not found
        if (!result) {
            const enDict = translations["en"];
            let enCurrent = enDict;
            for (const part of parts) {
                if (enCurrent == null) break;
                enCurrent = enCurrent[part];
            }
            result = typeof enCurrent === "string" ? enCurrent : "";
        }

        // Interpolate placeholders
        if (replacements && result) {
            Object.entries(replacements).forEach(([k, v]) => {
                result = result.replace(new RegExp(`\\{${k}\\}`, "g"), v);
            });
        }

        return result;
    }, [websiteLanguage]);

    return (
        <LanguageContext.Provider
            value={{
                websiteLanguage,
                targetLanguage,
                setWebsiteLanguage,
                setTargetLanguage,
                t,
            }}
        >
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
};
