"""
Helper utility functions.

Common utility functions used across the application.
"""
from datetime import datetime, timezone


def get_current_utc_time() -> datetime:
    """
    Get current UTC time.

    Returns:
        Current UTC datetime with timezone info
    """
    return datetime.now(timezone.utc)


def generate_uuid() -> str:
    """
    Generate a UUID string.

    Returns:
        UUID as string
    """
    import uuid
    return str(uuid.uuid4())


def sanitize_string(text: str, max_length: int = 255) -> str:
    """
    Sanitize a string by truncating and stripping whitespace.

    Args:
        text: String to sanitize
        max_length: Maximum allowed length

    Returns:
        Sanitized string
    """
    return text.strip()[:max_length] if text else ""


def validate_email(email: str) -> bool:
    """
    Validate email format.

    Args:
        email: Email address to validate

    Returns:
        True if valid, False otherwise
    """
    import re
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return re.match(pattern, email) is not None
