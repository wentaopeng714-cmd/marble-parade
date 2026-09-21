#!/bin/zsh
cd -- "$(dirname -- "$0")"
python3 - <<'PY'
import http.server, socketserver, pathlib, threading, webbrowser, functools
root=pathlib.Path.cwd()/'dist'
if not (root/'index.html').exists():
    raise SystemExit('dist/index.html is missing. Run npm run build first.')
handler=functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(root))
server=None
for port in range(4187,4208):
    try:
        server=socketserver.TCPServer(('127.0.0.1',port),handler)
        break
    except OSError:
        continue
if server is None:
    raise SystemExit('Ports 4187-4207 are busy. Close an old preview and try again.')
url=f'http://127.0.0.1:{port}/'
print('\nMarble Parade is running: '+url+'\nKeep this window open. Press Control+C to stop.\n')
threading.Timer(.5,lambda:webbrowser.open(url)).start()
try:
    server.serve_forever()
except KeyboardInterrupt:
    print('\nSee you next time!')
finally:
    server.server_close()
PY
