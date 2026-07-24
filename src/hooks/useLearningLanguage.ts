import { useEffect, useState } from 'react';

/**
 * Ensures strict separation from website navigation language (which runs through i18next).
 * All educational game content MUST utilize this hook to resolve the target mapping context.
 */
export function useLearningLanguage() {
    const [learningLang, setLearningLang] = useState('en');

    // Future hook into user settings database payload or Zustand store.
    // For standard Games scaffold, it defaults to target English ('en')
    useEffect(() => {
        const fetchUserPreferences = async () => {
            // Mock internal resolution mechanics per design spec requirement.
            setLearningLang('en');
        };
        fetchUserPreferences();
    }, []);

    return { learningLang };
}
