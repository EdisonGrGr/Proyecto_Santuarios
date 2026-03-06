const { createClient } = require('@supabase/supabase-js');

// Helper para enviar respuestas JSON
const sendJSON = (res, statusCode, data) => {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
};

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const bucketName = process.env.SUPABASE_BUCKET_NAME || 'santuarios-media';

// Inicializar cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Handler para eliminar archivos
 */
module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Manejar preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  // Solo aceptar DELETE
  if (req.method !== 'DELETE') {
    return sendJSON(res, 405, {
      success: false,
      error: 'Método no permitido. Use DELETE.'
    });
  }

  try {
    // Validar configuración de Supabase
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Configuración de Supabase incompleta');
    }

    // Obtener el path del archivo desde query params o body
    const filePath = req.query.path || (req.body && req.body.path);

    if (!filePath) {
      return sendJSON(res, 400, {
        success: false,
        error: 'Path del archivo no proporcionado'
      });
    }

    // Eliminar el archivo de Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      throw new Error(`Error al eliminar archivo: ${error.message}`);
    }

    return sendJSON(res, 200, {
      success: true,
      message: 'Archivo eliminado exitosamente',
      data: data
    });

  } catch (error) {
    console.error('Error en delete:', error);
    
    return sendJSON(res, 500, {
      success: false,
      error: error.message || 'Error al procesar la solicitud'
    });
  }
};
