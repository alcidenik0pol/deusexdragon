import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { db } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = dirname(dirname(__dirname));

const server = createServer(async (req, res) => {
    try {
        // Handle API requests
        if (req.url?.startsWith('/api/')) {
            return handleApiRequest(req, res);
        }

        // Serve static files
        let path = req.url === '/' ? '/index.html' : req.url;
        const ext = path?.split('.').pop() || '';
        
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
        const content = await readFile(join(PROJECT_ROOT, path!));
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
        
    } catch (error) {
        res.writeHead(404);
        res.end('Not found');
    }
});

async function handleApiRequest(req: any, res: any) {
    try {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const path = url.pathname.slice(4); // Remove '/api'

        let body = '';
        req.on('data', (chunk: string) => { body += chunk; });
        
        await new Promise((resolve) => {
            req.on('end', resolve);
        });

        const data = body ? JSON.parse(body) : {};
        console.log('Received API request:', { path, method: req.method, data });

        switch (path) {
            case '/npc':
                if (req.method === 'POST') {
                    console.log('Creating NPC with data:', data);
                    await db.createNPC(data);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true }));
                }
                break;
            // Add other API endpoints...
            default:
                res.writeHead(404);
                res.end(JSON.stringify({ error: 'API endpoint not found' }));
        }
    } catch (error: any) {
        console.error('API Error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            error: error.message || 'Internal Server Error',
            details: error.toString(),
            stack: error.stack
        }));
    }
}

const port = 3000;
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 