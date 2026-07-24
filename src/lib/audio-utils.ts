export interface ResolutionResult {
    voice: SpeechSynthesisVoice | null;
    exactMatch: boolean;
}

export function resolveBrowserVoice(voicePref: string, defaultLangCode = "en-IN"): ResolutionResult {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return { voice: null, exactMatch: false };

    let langCode = defaultLangCode;
    if (voicePref.includes("American")) langCode = "en-US";
    else if (voicePref.includes("British")) langCode = "en-GB";
    else if (voicePref.includes("Telugu")) langCode = "te-IN";
    else if (voicePref.includes("Hindi")) langCode = "hi-IN";

    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return { voice: null, exactMatch: false };

    let preferredVoice = null;
    let exactMatch = false;

    if (voicePref.includes("Female")) {
        preferredVoice = voices.find(v => v.lang.startsWith(langCode.split('-')[0]) && (v.name.includes('Female') || v.name.includes('Google') || v.name.includes('Zira')));
        if (preferredVoice) exactMatch = true;
    } else if (voicePref.includes("Male")) {
        preferredVoice = voices.find(v => v.lang.startsWith(langCode.split('-')[0]) && (v.name.includes('Male') || v.name.includes('David') || v.name.includes('Ravi')));
        if (preferredVoice) exactMatch = true;
    }

    if (!preferredVoice) {
        // Fallback: any voice matching the language code loosely
        preferredVoice = voices.find(v => v.lang.startsWith(langCode.split('-')[0])) || null;
    }

    return { voice: preferredVoice, exactMatch };
}

export function playTestVoice(voicePref: string, speedStr: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance("Hello. This is the selected voice.");

    // Default rate
    utter.rate = parseFloat(speedStr || "1");

    const { voice: resolved } = resolveBrowserVoice(voicePref, "en-IN");
    if (resolved) {
        utter.voice = resolved;
        utter.lang = resolved.lang;
    } else {
        utter.lang = "en-US";
    }

    window.speechSynthesis.speak(utter);
}
