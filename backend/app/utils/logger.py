"""
Logging configuration.

Configures structured logging for the application.
"""
import logging
import sys
from app.core.config import settings


def setup_logging() -> None:
    """
    Set up application logging.

    Configures logging based on settings.LOG_LEVEL and settings.LOG_FORMAT.
    Supports both JSON and text formats.
    """
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    # Configure root logger
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)],
    )

    # TODO: Implement JSON logging if settings.LOG_FORMAT == "json"
    # For now, using standard text format


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance.

    Args:
        name: Logger name (typically __name__)

    Returns:
        Configured logger instance
    """
    return logging.getLogger(name)
