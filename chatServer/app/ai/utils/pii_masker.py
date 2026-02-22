"""
PII (Personally Identifiable Information) Masker
Partially masks sensitive values in chat messages.
Does NOT block or alert — just hides middle digits for privacy.
"""
import re
import logging
from typing import Dict, Any
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass
class MaskedMessage:
    original: str
    masked: str
    pii_found: Dict[str, list] = field(default_factory=dict)
    has_sensitive_info: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "original": self.original,
            "masked": self.masked,
            "pii_found": self.pii_found,
            "has_sensitive_info": self.has_sensitive_info,
        }


class PIIMasker:
    """
    Partially masks PII values found in chat messages.

    Masking style (show first + last digits, hide middle):
      Phone:       9985487598   →  9985****98
      Card:        4111111111111111  →  4111********1111
      Account no:  ACC123456789  →  ACC1****89
      SSN:         123-45-6789  →  123-**-6789
      Email:       user@example.com  →  us**@example.com
      Password:    (any word after "password") → ********
    """

    # ── Patterns ────────────────────────────────────────────────────────────
    # Each entry: (name, regex, mask_fn)
    # mask_fn receives the full match string and returns the masked version.

    @staticmethod
    def _mask_phone(m: str) -> str:
        digits = re.sub(r'\D', '', m)
        if len(digits) >= 8:
            return digits[:4] + '*' * (len(digits) - 6) + digits[-2:]
        return '****'

    @staticmethod
    def _mask_card(m: str) -> str:
        digits = re.sub(r'\D', '', m)
        if len(digits) >= 12:
            return digits[:4] + '*' * (len(digits) - 8) + digits[-4:]
        return '****'

    @staticmethod
    def _mask_ssn(m: str) -> str:
        # 123-45-6789 → 123-**-6789
        parts = m.split('-')
        if len(parts) == 3:
            return f"{parts[0]}-**-{parts[2]}"
        return '***-**-****'

    @staticmethod
    def _mask_email(m: str) -> str:
        local, domain = m.split('@', 1)
        if len(local) <= 2:
            return f"{'*' * len(local)}@{domain}"
        return f"{local[:2]}{'*' * (len(local) - 2)}@{domain}"

    @staticmethod
    def _mask_account(m: str) -> str:
        # Keep first 4 chars + last 2, mask middle
        if len(m) > 6:
            return m[:4] + '*' * (len(m) - 6) + m[-2:]
        return m[:2] + '****'

    # Pattern definitions: (label, compiled_regex, mask_function)
    # Order matters — more specific patterns first.
    PATTERNS = [
        (
            "credit_card",
            re.compile(r'\b(?:\d[ -]?){15,16}\b'),
            _mask_card.__func__,
        ),
        (
            "ssn",
            re.compile(r'\b\d{3}-\d{2}-\d{4}\b'),
            _mask_ssn.__func__,
        ),
        (
            "phone",
            # Indian (10 digit) or international with optional +country code
            re.compile(r'(?<!\d)(?:\+91[-\s]?)?[6-9]\d{9}(?!\d)'),
            _mask_phone.__func__,
        ),
        (
            "email",
            re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b'),
            _mask_email.__func__,
        ),
        (
            "account_number",
            # Matches account numbers: must have at least 2 digits to avoid matching words like "progress"
            # Pattern: account keyword + separator + token containing digits
            re.compile(
                r'\b(?:account\s*(?:no\.?|number|#|:)|a\/c\s*:?|acc\s*:?)\s*([A-Z]{0,4}\d[A-Z0-9]{5,19})\b',
                re.IGNORECASE
            ),
            lambda m: re.sub(r'[A-Z]{0,4}\d[A-Z0-9]{5,19}', lambda x: _mask_account_static(x.group()), m, count=1, flags=re.IGNORECASE),
        ),
        (
            "password",
            re.compile(r'(?:password|passwd|pwd)\s*(?:is|:|=)?\s*(\S+)', re.IGNORECASE),
            lambda m: re.sub(r'(\S+)$', '********', m),
        ),
    ]

    def mask(self, text: str) -> MaskedMessage:
        masked_text = text
        pii_found: Dict[str, list] = {}

        for label, pattern, mask_fn in self.PATTERNS:
            matches = pattern.findall(masked_text)
            if not matches:
                continue

            pii_found[label] = matches
            # Replace each full match using sub with mask_fn
            masked_text = pattern.sub(lambda m: mask_fn(m.group()), masked_text)

        if pii_found:
            logger.info("PII masked in message: %s", list(pii_found.keys()))

        return MaskedMessage(
            original=text,
            masked=masked_text,
            pii_found=pii_found,
            has_sensitive_info=bool(pii_found),
        )

    def get_safety_message(self, result: MaskedMessage) -> str:
        """
        Small inline note appended to the message (not a blocking alert).
        Only shown when actual PII was masked.
        """
        if not result.has_sensitive_info:
            return ""
        labels = [k.replace("_", " ") for k in result.pii_found]
        return (
            f"🔐 Sensitive info ({', '.join(labels)}) detected and partially masked for your privacy."
        )


# ── helper used inside lambda (lambdas can't call self) ─────────────────────
def _mask_account_static(m: str) -> str:
    if len(m) > 6:
        return m[:4] + '*' * (len(m) - 6) + m[-2:]
    return m[:2] + '****'


# Global instance
pii_masker = PIIMasker()


def mask_message(text: str) -> MaskedMessage:
    return pii_masker.mask(text)


def get_safety_message(result: MaskedMessage) -> str:
    return pii_masker.get_safety_message(result)