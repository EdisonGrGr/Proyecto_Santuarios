# Microservicio de Carga de Archivos - Santuarios

Microservicio serverless para la carga de fotos y videos a Supabase Storage usando Node.js y Vercel.

## 🚀 Características

- ✅ Carga de imágenes (JPEG, PNG, WebP, GIF)
- ✅ Carga de videos (MP4, WebM, QuickTime)
- ✅ Validación de tamaño y tipo de archivo
- ✅ Generación automática de nombres únicos
- ✅ URLs públicas de los archivos
- ✅ Eliminación de archivos
- ✅ Listado de archivos
- ✅ CORS habilitado
- ✅ Serverless (Vercel)

## 📋 Requisitos Previos

1. **Cuenta de Supabase**
   - Crear un proyecto en [Supabase](https://supabase.com)
   - Crear un bucket de storage llamado `santuarios-media` (o el nombre que prefieras)
   - Configurar las políticas de acceso del bucket

2. **Cuenta de Vercel**
   - Crear una cuenta en [Vercel](https://vercel.com)

3. **Node.js**
   - Versión 18.x o superior

## 🔧 Instalación

1. **Clonar o crear el proyecto**
```bash
cd Proyecto_Santuarios
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Crear un archivo `.env` basado en `.env.example`:

```bash
cp .env.example .env
```

Editar `.env` con tus credenciales de Supabase:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
SUPABASE_BUCKET_NAME=santuarios-media
```

## 🏃 Desarrollo Local

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

## 📤 Endpoints

### 1. Subir Archivo

**Endpoint:** `POST /api/upload`

**Tipo:** `multipart/form-data`

**Parámetros:**
- `file`: Archivo a subir (imagen o video)

**Ejemplo con cURL:**
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@/ruta/a/imagen.jpg"
```

**Ejemplo con JavaScript:**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('http://localhost:3000/api/upload', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result);
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "fileName": "images/1234567890-abc123.jpg",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "size": 102400,
    "publicUrl": "https://xxx.supabase.co/storage/v1/object/public/santuarios-media/images/1234567890-abc123.jpg",
    "path": "images/1234567890-abc123.jpg"
  },
  "message": "Archivo subido exitosamente"
}
```

### 2. Eliminar Archivo

**Endpoint:** `DELETE /api/delete?path={filepath}`

**Parámetros:**
- `path`: Ruta del archivo a eliminar

**Ejemplo:**
```bash
curl -X DELETE "http://localhost:3000/api/delete?path=images/1234567890-abc123.jpg"
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Archivo eliminado exitosamente"
}
```

### 3. Listar Archivos

**Endpoint:** `GET /api/list?folder={folder}&limit={limit}&offset={offset}`

**Parámetros opcionales:**
- `folder`: Carpeta a listar (default: raíz)
- `limit`: Cantidad máxima de resultados (default: 100)
- `offset`: Offset para paginación (default: 0)

**Ejemplo:**
```bash
curl "http://localhost:3000/api/list?folder=images&limit=10"
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "name": "1234567890-abc123.jpg",
      "path": "images/1234567890-abc123.jpg",
      "size": 102400,
      "createdAt": "2026-03-06T10:00:00.000Z",
      "publicUrl": "https://xxx.supabase.co/storage/v1/object/public/santuarios-media/images/1234567890-abc123.jpg"
    }
  ],
  "total": 1,
  "folder": "images"
}
```

## 🚀 Despliegue en Vercel

### Opción 1: Desde CLI

1. **Instalar Vercel CLI**
```bash
npm i -g vercel
```

2. **Login en Vercel**
```bash
vercel login
```

3. **Configurar variables de entorno en Vercel**
```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add SUPABASE_BUCKET_NAME
```

4. **Desplegar**
```bash
vercel --prod
```

### Opción 2: Desde GitHub

1. Push el código a GitHub
2. Importar el repositorio en Vercel
3. Configurar las variables de entorno en el dashboard
4. Deploy automático

## 🔒 Configurar Supabase Storage

1. **Crear bucket**
   - Ve a Storage en tu proyecto de Supabase
   - Crea un nuevo bucket llamado `santuarios-media`
   - Marca como público si quieres URLs públicas

2. **Configurar políticas (Policies)**

Para permitir lectura pública:
```sql
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'santuarios-media' );
```

Para permitir subida autenticada:
```sql
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'santuarios-media' AND auth.role() = 'authenticated' );
```

Para permitir eliminación autenticada:
```sql
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'santuarios-media' AND auth.role() = 'authenticated' );
```

## ⚙️ Configuración

### Tipos de archivos permitidos

Editar en `.env`:
```env
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp,image/gif
ALLOWED_VIDEO_TYPES=video/mp4,video/webm,video/quicktime
```

### Tamaños máximos

```env
MAX_IMAGE_SIZE=52428800  # 50MB en bytes
MAX_VIDEO_SIZE=209715200 # 200MB en bytes
```

## 🧪 Pruebas

### HTML de ejemplo para pruebas

Crear un archivo `test.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Test Upload</title>
</head>
<body>
  <h1>Probar Subida de Archivos</h1>
  <input type="file" id="fileInput" accept="image/*,video/*">
  <button onclick="uploadFile()">Subir</button>
  <div id="result"></div>

  <script>
    async function uploadFile() {
      const fileInput = document.getElementById('fileInput');
      const file = fileInput.files[0];
      
      if (!file) {
        alert('Selecciona un archivo');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('http://localhost:3000/api/upload', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();
        document.getElementById('result').innerHTML = 
          '<pre>' + JSON.stringify(result, null, 2) + '</pre>';
        
        if (result.success) {
          document.getElementById('result').innerHTML += 
            '<img src="' + result.data.publicUrl + '" style="max-width: 500px;">';
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error al subir archivo');
      }
    }
  </script>
</body>
</html>
```

## 📝 Notas

- Los archivos se organizan automáticamente en carpetas `images/` y `videos/`
- Los nombres de archivo incluyen timestamp y string aleatorio para evitar colisiones
- El servicio usa Service Role Key para operaciones administrativas (mayor permiso)
- Para producción, considera implementar autenticación y limitar acceso

## 🐛 Troubleshooting

### Error: "Configuración de Supabase incompleta"
- Verifica que todas las variables de entorno estén configuradas correctamente

### Error: "Bucket not found"
- Asegúrate de que el bucket existe en Supabase Storage
- Verifica el nombre del bucket en las variables de entorno

### Error: "File too large"
- Aumenta `MAX_IMAGE_SIZE` o `MAX_VIDEO_SIZE` en `.env`
- Verifica los límites en `vercel.json` (maxDuration, memory)

### Error de CORS
- El servicio ya incluye headers CORS, pero verifica la configuración en Supabase

## 📄 Licencia

MIT
