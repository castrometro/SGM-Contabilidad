import unicodedata


def normalize_text(value):
    """Normalize text to lowercase ASCII without accents for header comparisons."""
    if value is None:
        return ""
    if not isinstance(value, str):
        value = str(value)
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    return normalized.strip().lower()
