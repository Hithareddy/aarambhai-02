import json
import os
from functools import lru_cache
from typing import Dict

from fastapi import APIRouter, HTTPException

router = APIRouter()

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..', 'src', 'locales'))

@lru_cache(maxsize=32)
def load_translation(lang: str) -> Dict:
    """Load translation JSON for the given language.
    Falls back to English if the language file does not exist or is missing keys.
    """
    lang_path = os.path.join(BASE_DIR, lang, 'common.json')
    if not os.path.isfile(lang_path):
        # fallback to English
        lang_path = os.path.join(BASE_DIR, 'en', 'common.json')
        if not os.path.isfile(lang_path):
            raise FileNotFoundError('English translation file missing')
    with open(lang_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data

@router.get('/translations/{lang}', response_model=dict)
async def get_translations(lang: str):
    """Return translation dictionary for the requested language.
    If a key is missing, the frontend should fallback to English using the same dictionary.
    """
    try:
        translations = load_translation(lang)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail='Translation not found')
    return translations
