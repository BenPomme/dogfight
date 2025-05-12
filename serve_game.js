const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Define the directory of the space-dogfight project
const GAME_DIR = path.join(__dirname, 'space-dogfight');
const PORT = 3000;

// MIME types for different file extensions
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg'
};

// Create HTTP server
const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  // Parse URL and get pathname
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;
  
  // Normalize pathname to prevent directory traversal attacks
  pathname = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  
  // Default to index.html if root is requested
  if (pathname === '/' || pathname === '') {
    pathname = '/public/index.html';
  }
  
  // Construct the full path to the requested file
  const filePath = path.join(GAME_DIR, pathname);
  
  // Get file extension to determine content type
  const ext = path.extname(filePath).toLowerCase();
  
  // Read file
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found - try checking in public directory
        const publicFilePath = path.join(GAME_DIR, 'public', pathname);
        fs.readFile(publicFilePath, (pubErr, pubData) => {
          if (pubErr) {
            // Still not found
            console.log(`File not found: ${filePath}`);
            res.writeHead(404);
            res.end('404 Not Found');
            return;
          }
          
          // File found in public directory
          const contentType = MIME_TYPES[ext] || 'application/octet-stream';
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(pubData);
        });
        return;
      }
      
      // Other server error
      console.error(`Server error: ${err}`);
      res.writeHead(500);
      res.end('500 Internal Server Error');
      return;
    }
    
    // Return the file
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`[Game Server] Running at http://localhost:${PORT}/`);
  console.log(`[Game Server] Serving files from ${GAME_DIR}`);
  console.log('[Game Server] Press Ctrl+C to stop');
});