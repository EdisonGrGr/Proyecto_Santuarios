const { createClient } = require('@supabase/supabase-js');

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
    return res.status(200).end();
  }

  // Solo aceptar DELETE
  if (req.method !== 'DELETE') {
    return res.status(405).json({
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
      return res.status(400).json({
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

    return res.status(200).json({
      success: true,
      message: 'Archivo eliminado exitosamente',
      data: data
    });

  } catch (error) {
    console.error('Error en delete:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al procesar la solicitud'
    });
  }
};
