import { useEffect, useState } from 'react';

/**
 * Ensures strict separation from website navigation language.
 * Educational content & games utilize this hook to resolve the target learning language.
 */
export function useLearningLanguage() {
    const [learningLang, setLearningLang] = useState<string>(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("target_language") || localStorage.getItem("learning_language") || 'en';
        }
        return 'en';
    });

    useEffect(() => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("target_language") || localStorage.getItem("learning_language");
            if (stored) {
                setLearningLang(stored);
            }
        }
    }, []);

    return { learningLang };
}

