const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Cargar variables de entorno desde .env
require('dotenv').config();

const PORT = process.env.PORT || 3000;

// Importar los handlers de las APIs
const uploadHandler = require('./api/upload');
const deleteHandler = require('./api/delete');
const listHandler = require('./api/list');

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${pathname}`);

  // Servir archivos estáticos
  if (pathname === '/' || pathname === '/test.html') {
    try {
      const filePath = path.join(__dirname, 'test.html');
      const content = fs.readFileSync(filePath, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
      return;
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error loading test.html');
      return;
    }
  }

  // API Routes
  if (pathname === '/api/upload') {
    await uploadHandler(req, res);
    return;
  }

  if (pathname === '/api/delete') {
    await deleteHandler(req, res);
    return;
  }

  if (pathname === '/api/list') {
    await listHandler(req, res);
    return;
  }

  // 404 - Not Found
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET  /',
      'POST /api/upload',
      'DELETE /api/delete',
      'GET  /api/list'
    ]
  }));
});

server.listen(PORT, () => {
  console.log('\n🚀 Servidor de desarrollo iniciado');
  console.log(`📡 Escuchando en: http://localhost:${PORT}`);
  console.log(`🧪 Página de pruebas: http://localhost:${PORT}/test.html`);
  console.log('\n📋 Endpoints disponibles:');
  console.log(`   POST   http://localhost:${PORT}/api/upload`);
  console.log(`   DELETE http://localhost:${PORT}/api/delete`);
  console.log(`   GET    http://localhost:${PORT}/api/list`);
  console.log('\n💡 Presiona Ctrl+C para detener el servidor\n');
});

// Manejo de errores
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Error: El puerto ${PORT} ya está en uso`);
    console.log('💡 Intenta cerrar otras aplicaciones o usa otro puerto:');
    console.log('   PORT=3001 npm run dev');
  } else {
    console.error('❌ Error del servidor:', error);
  }
  process.exit(1);
});

// Manejo de cierre graceful
process.on('SIGINT', () => {
  console.log('\n\n👋 Cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});
