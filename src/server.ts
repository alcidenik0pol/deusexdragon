import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = dirname(__dirname);

const server = createServer(async (req, res) => {
    try {
        // Default to index.html
        let path = req.url === '/' ? '/index.html' : req.url;
        
        // Get the file extension
        const ext = path?.split('.').pop() || '';
        
        // Set content type based on file extension
        const contentTypes: { [key: string]: string } = {
            'html': 'text/html',
            'js': 'text/javascript',
            'css': 'text/css',
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'gif': 'image/gif',
            'glb': 'model/gltf-binary'
        };

        const contentType = contentTypes[ext] || 'text/plain';
        
        // Read and serve the file from project root
        const content = await readFile(join(PROJECT_ROOT, path!));
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
        
    } catch (error) {
        // If file not found or other error
        res.writeHead(404);
        res.end('Not found');
    }
});

const port = 3000;
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 