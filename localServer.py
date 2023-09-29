import http.server
import socketserver

Port = 8000

Handler = http.server.SimpleHTTPRequestHandler
Handler.extensions_map.update({
	".js": "application/javascript",
})

httpd = socketserver.TCPServer(("", Port), Handler)
httpd.serve_forever()