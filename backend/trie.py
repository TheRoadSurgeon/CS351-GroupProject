# backend/trie.py
from __future__ import annotations
from collections import deque
from typing import Dict, List, Set, Tuple

class TrieNode:
    __slots__ = ("children", "is_end", "ids")
    def __init__(self) -> None:
        self.children: Dict[str, TrieNode] = {}
        self.is_end: bool = False
        self.ids: Set[str] = set()

class Trie:
    def __init__(self) -> None:
        self.root: TrieNode = TrieNode()

    @staticmethod
    def _norm(s: str) -> str:
        return "".join(ch.lower() for ch in s if ch.isalnum() or ch.isspace())

    def insert(self, word: str, item_id: str) -> None:
        w = self._norm(word)
        node = self.root
        for ch in w:
            if ch not in node.children:
                node.children[ch] = TrieNode()
            node = node.children[ch]
        node.is_end = True
        node.ids.add(item_id)

    def _walk(self, node: TrieNode, prefix: str, limit: int) -> List[str]:
        out: List[str] = []
        dq: deque[Tuple[TrieNode, str]] = deque([(node, prefix)])
        while dq and len(out) < limit:
            cur, _ = dq.popleft()
            if cur.is_end:
                for _id in cur.ids:
                    out.append(_id)
                    if len(out) >= limit:
                        break
            for ch in sorted(cur.children.keys()):
                dq.append((cur.children[ch], prefix + ch))
        return out

    def prefix_ids(self, prefix: str, limit: int = 20) -> List[str]:
        p = self._norm(prefix)
        node = self.root
        for ch in p:
            if ch not in node.children:
                return []
            node = node.children[ch]
        return self._walk(node, p, limit)
