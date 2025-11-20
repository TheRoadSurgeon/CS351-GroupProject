# bloom_filter.py
import hashlib


class BloomFilter:

    def __init__(self, size=8192, hash_count=3):
        self.size = size
        self.hash_count = hash_count
        self.bit_array = 0

    def _hashes(self, item: str):
        if item is None:
            item = ""
        b = item.encode("utf-8")

        for i in range(self.hash_count):
            salted = b + i.to_bytes(1, "little")
            digest = hashlib.sha256(salted).hexdigest()
            value = int(digest, 16)
            yield value % self.size

    def add(self, item: str):
        for pos in self._hashes(item):
            self.bit_array |= (1 << pos)

    def __contains__(self, item: str) -> bool:
        for pos in self._hashes(item):
            if (self.bit_array & (1 << pos)) == 0:
                return False
        return True

    def clear(self):
        self.bit_array = 0
