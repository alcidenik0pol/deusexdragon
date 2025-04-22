// import express from 'express';
// import dotenv from 'dotenv';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import api from './api.js';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// dotenv.config();

// const app = express();
// const port = process.env.PORT || 3000;

// // Middleware
// app.use(express.json());
// app.use(express.static(path.join(__dirname, '..'))); // Serve files from project root

// // API routes
// app.use('/api', api);

// // Default route
// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, '..', 'index.html'));
// });

// // Error handling middleware
// app.use((err, req, res, next) => {
//     console.error(err.stack);
//     res.status(500).json({ error: 'Something broke!' });
// });

// app.listen(port, () => {
//     console.log(`Server running on port ${port}`);
// }); 