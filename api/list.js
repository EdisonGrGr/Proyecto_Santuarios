const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const bucketName = process.env.SUPABASE_BUCKET_NAME || 'santuarios-media';

// Inicializar cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Handler para listar archivos
 */
module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Manejar preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Solo aceptar GET
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Método no permitido. Use GET.'
    });
  }

  try {
    // Validar configuración de Supabase
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Configuración de Supabase incompleta');
    }

    // Obtener parámetros opcionales
    const folder = req.query.folder || '';
    const limit = parseInt(req.query.limit || '100');
    const offset = parseInt(req.query.offset || '0');

    // Listar archivos en el bucket
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(folder, {
        limit: limit,
        offset: offset,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      throw new Error(`Error al listar archivos: ${error.message}`);
    }

    // Generar URLs públicas para cada archivo
    const filesWithUrls = data.map(file => {
      const filePath = folder ? `${folder}/${file.name}` : file.name;
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      return {
        name: file.name,
        path: filePath,
        size: file.metadata?.size,
        createdAt: file.created_at,
        updatedAt: file.updated_at,
        publicUrl: urlData.publicUrl
      };
    });

    return res.status(200).json({
      success: true,
      data: filesWithUrls,
      total: filesWithUrls.length,
      folder: folder || 'root'
    });

  } catch (error) {
    console.error('Error en list:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al procesar la solicitud'
    });
  }
};
