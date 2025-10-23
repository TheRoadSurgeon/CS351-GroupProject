from collections import deque

class TrieNode:
    def __init__(self):
        self.children = {}
        self.isWord = False
        self.ids = set()

class Trie:
    def __init__(self):
        self.insertDataMember = 0
        self.root = TrieNode()

    def clean(self, s):
        res = []
        for ch in s:
            if ch.isalpha() or ch.isspace():
                res.append(ch.lower())
        return "".join(res)

    def getFromFile(self, fname):
        try:
            with open(fname, "r", encoding="utf-8") as f:
                for line in f:
                    for tok in line.split():
                        c = self.clean(tok)
                        if c:
                            self.insert(c)
            return True
        except OSError:
            return False

    def insert(self, word, item_id=None):
        w = self.clean(word)
        if not w:
            return False
        curr = self.root
        for ch in w:
            if ch not in curr.children:
                curr.children[ch] = TrieNode()
            curr = curr.children[ch]
        new_word = not curr.isWord
        if new_word:
            curr.isWord = True
            self.insertDataMember += 1
        if item_id is not None:
            before = len(curr.ids)
            curr.ids.add(item_id)
            return new_word or len(curr.ids) > before
        return new_word

    def search(self, word):
        w = self.clean(word)
        curr = self.root
        for ch in w:
            if ch not in curr.children:
                return False
            curr = curr.children[ch]
        return curr.isWord

    def remove(self, word, item_id=None):
        w = self.clean(word)
        curr = self.root
        for ch in w:
            if ch not in curr.children:
                return False
            curr = curr.children[ch]
        if not curr.isWord:
            return False
        if item_id is not None:
            if item_id in curr.ids:
                curr.ids.remove(item_id)
                if not curr.ids:
                    curr.isWord = False
                    self.insertDataMember -= 1
                return True
            return False
        curr.isWord = False
        curr.ids.clear()
        self.insertDataMember -= 1
        return True

    def clear(self):
        self.root = TrieNode()
        self.insertDataMember = 0
        return True

    def wordCount(self):
        return self.insertDataMember

    def words(self):
        out = []
        def dfs(node, seq):
            if node.isWord:
                out.append(seq)
            for ch in sorted(node.children.keys()):
                dfs(node.children[ch], seq + ch)
        dfs(self.root, "")
        return out

    def check_all_ids(self, node, limit):
        out = []
        dq = deque([node])
        seen = set()
        while dq and len(out) < limit:
            cur = dq.popleft()
            if cur.isWord:
                for _id in cur.ids:
                    if _id not in seen:
                        out.append(_id)
                        seen.add(_id)
                        if len(out) >= limit:
                            break
            for child in cur.children.values():
                dq.append(child)
        return out

    def words_with_prefix(self, prefix, limit=None):
        p = self.clean(prefix)
        curr = self.root
        for ch in p:
            if ch not in curr.children:
                return []
            curr = curr.children[ch]
        res = []
        def dfs(node, seq):
            if limit is not None and len(res) >= limit:
                return
            if node.isWord:
                res.append(seq)
            for ch in sorted(node.children.keys()):
                dfs(node.children[ch], seq + ch)
        dfs(curr, p)
        return res

    def prefix_ids(self, prefix, limit=20):
        p = self.clean(prefix)
        curr = self.root
        for ch in p:
            if ch not in curr.children:
                return []
            curr = curr.children[ch]
        return self.check_all_ids(curr, limit)
