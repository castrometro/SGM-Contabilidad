import unittest

from rindegastos.utils import normalize_text


class NormalizeTextTests(unittest.TestCase):
    def test_removes_accents_and_lowercases(self):
        self.assertEqual(normalize_text("FéCha Aprobación"), "fecha aprobacion")

    def test_handles_none_and_whitespace(self):
        self.assertEqual(normalize_text(None), "")
        self.assertEqual(normalize_text("   Texto  "), "texto")

    def test_coerces_non_strings(self):
        self.assertEqual(normalize_text(123), "123")
        self.assertEqual(normalize_text(12.5), "12.5")


if __name__ == "__main__":
    unittest.main()
