const { createClient } = require('@supabase/supabase-js');
const { formidable } = require('formidable');
const fs = require('fs').promises;
const path = require('path');
const mime = require('mime-types');

// Helper para enviar respuestas JSON
const sendJSON = (res, statusCode, data) => {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
};

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const bucketName = process.env.SUPABASE_BUCKET_NAME || 'santuarios-media';

// Configuración de archivos permitidos
const allowedImageTypes = (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/webp,image/gif').split(',');
const allowedVideoTypes = (process.env.ALLOWED_VIDEO_TYPES || 'video/mp4,video/webm,video/quicktime').split(',');
const maxImageSize = parseInt(process.env.MAX_IMAGE_SIZE || '52428800'); // 50MB
const maxVideoSize = parseInt(process.env.MAX_VIDEO_SIZE || '209715200'); // 200MB

// Inicializar cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Parsea el formulario multipart
 */
const parseForm = (req) => {
  return new Promise((resolve, reject) => {
    const form = formidable({
      maxFileSize: maxVideoSize, // Tamaño máximo general
      allowEmptyFiles: false,
      multiples: true
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({ fields, files });
    });
  });
};

/**
 * Valida el archivo según tipo y tamaño
 */
const validateFile = (file) => {
  const fileType = file.mimetype;
  const fileSize = file.size;

  // Verificar si es imagen
  if (allowedImageTypes.includes(fileType)) {
    if (fileSize > maxImageSize) {
      throw new Error(`La imagen excede el tamaño máximo de ${maxImageSize / 1048576}MB`);
    }
    return 'image';
  }

  // Verificar si es video
  if (allowedVideoTypes.includes(fileType)) {
    if (fileSize > maxVideoSize) {
      throw new Error(`El video excede el tamaño máximo de ${maxVideoSize / 1048576}MB`);
    }
    return 'video';
  }

  throw new Error(`Tipo de archivo no permitido: ${fileType}`);
};

/**
 * Genera un nombre único para el archivo
 */
const generateFileName = (originalName, type) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const ext = path.extname(originalName);
  const folder = type === 'image' ? 'images' : 'videos';
  
  return `${folder}/${timestamp}-${random}${ext}`;
};

/**
 * Sube el archivo a Supabase Storage
 */
const uploadToSupabase = async (filePath, fileName, mimeType) => {
  try {
    // Leer el archivo
    const fileBuffer = await fs.readFile(filePath);

    // Subir a Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, fileBuffer, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    return {
      path: data.path,
      publicUrl: urlData.publicUrl,
      fullPath: data.fullPath
    };
  } catch (error) {
    throw new Error(`Error al subir archivo a Supabase: ${error.message}`);
  }
};

/**
 * Handler principal de la API
 */
module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Manejar preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  // Solo aceptar POST
  if (req.method !== 'POST') {
    return sendJSON(res, 405, {
      success: false,
      error: 'Método no permitido. Use POST.'
    });
  }

  try {
    // Validar configuración de Supabase
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Configuración de Supabase incompleta');
    }

    // Parsear el formulario
    const { fields, files } = await parseForm(req);
    
    // Obtener el archivo (puede venir como 'file' o 'files')
    let file = files.file || files.files;
    
    // Si es un array, tomar el primero
    if (Array.isArray(file)) {
      file = file[0];
    }

    if (!file) {
      return sendJSON(res, 400, {
        success: false,
        error: 'No se recibió ningún archivo. Use el campo "file" en el formulario.'
      });
    }

    // Validar el archivo
    const fileType = validateFile(file);

    // Generar nombre único
    const fileName = generateFileName(file.originalFilename || file.newFilename, fileType);

    // Subir a Supabase
    const uploadResult = await uploadToSupabase(
      file.filepath,
      fileName,
      file.mimetype
    );

    // Limpiar archivo temporal
    try {
      await fs.unlink(file.filepath);
    } catch (cleanupError) {
      console.error('Error al limpiar archivo temporal:', cleanupError);
    }

    // Respuesta exitosa
    return sendJSON(res, 200, {
      success: true,
      data: {
        fileName: fileName,
        fileType: fileType,
        mimeType: file.mimetype,
        size: file.size,
        publicUrl: uploadResult.publicUrl,
        path: uploadResult.path
      },
      message: 'Archivo subido exitosamente'
    });

  } catch (error) {
    console.error('Error en upload:', error);
    
    return sendJSON(res, 500, {
      success: false,
      error: error.message || 'Error al procesar la solicitud'
    });
  }
};
