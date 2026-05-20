"""Lightweight domain / configuration errors (extend as the app grows)."""


class ConfigurationError(RuntimeError):
    """Raised when required settings or environment are invalid."""
