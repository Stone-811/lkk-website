# 比對 email-snapshot.ts 的兩份輸出，逐處列出差異（字元層級）。用法見 email-snapshot.ts 開頭。
import difflib
import json
import sys

a = json.load(open(sys.argv[1], encoding='utf-8'))
b = json.load(open(sys.argv[2], encoding='utf-8'))
print('notif', len(a['notif']), len(b['notif']), 'sent', len(a['sent']), len(b['sent']))
diffs = 0
for k in ('notif', 'sent'):
    for i, (x, y) in enumerate(zip(a[k], b[k])):
        for f in ('subject', 'html'):
            if x[f] == y[f]:
                continue
            for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, x[f], y[f]).get_opcodes():
                if op != 'equal':
                    diffs += 1
                    print(k, i, f, op, repr(x[f][i1:i2]), '->', repr(y[f][j1:j2]))
print('total diffs', diffs)
