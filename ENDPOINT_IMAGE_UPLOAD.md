# Endpoint: Subir Imagen Base64 a Cloudinary

## 📍 Endpoint

```
POST /api/images/upload
```

## 📝 Descripción

Este endpoint recibe una imagen codificada en base64, la sube a Cloudinary y retorna la URL pública de la imagen.

## 📤 Request Body

### Campos Requeridos:
- `imageBase64` (string): Imagen codificada en base64

### Campos Opcionales:
- `folder` (string): Carpeta en Cloudinary donde se guardará la imagen (default: `"fitbuddy/posts"`)
- `publicId` (string): ID público personalizado para la imagen en Cloudinary (opcional)

## 📥 Response

### Éxito (200):
```json
{
  "success": true,
  "message": "Imagen subida exitosamente a Cloudinary",
  "data": {
    "url": "https://res.cloudinary.com/tu-cloud/image/upload/v1234567890/fitbuddy/posts/abc123.jpg",
    "publicId": "fitbuddy/posts/abc123",
    "width": 1920,
    "height": 1080,
    "format": "jpg",
    "bytes": 245678,
    "folder": "fitbuddy/posts"
  }
}
```

### Error (400/500):
```json
{
  "success": false,
  "message": "Mensaje de error descriptivo",
  "error": "Detalles del error"
}
```

## 💡 Ejemplos de Uso

### Ejemplo 1: Subir imagen simple (base64 sin prefijo)

**Request:**
```bash
curl -X POST http://localhost:3000/api/images/upload \
  -H "Content-Type: application/json" \
  -d '{
    "imageBase64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  }'
```

### Ejemplo 2: Subir imagen con prefijo data:image (recomendado)

**Request:**
```bash
curl -X POST http://localhost:3000/api/images/upload \
  -H "Content-Type: application/json" \
  -d '{
    "imageBase64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  }'
```

### Ejemplo 3: Subir imagen con carpeta personalizada

**Request:**
```bash
curl -X POST http://localhost:3000/api/images/upload \
  -H "Content-Type: application/json" \
  -d '{
    "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
    "folder": "fitbuddy/avatars"
  }'
```

### Ejemplo 4: Subir imagen con publicId personalizado

**Request:**
```bash
curl -X POST http://localhost:3000/api/images/upload \
  -H "Content-Type: application/json" \
  -d '{
    "imageBase64": "data:image/png;base64,iVBORw0KG...",
    "folder": "fitbuddy/posts",
    "publicId": "post_12345"
  }'
```

## 📱 Ejemplo en JavaScript (Fetch API)

```javascript
// Convertir imagen a base64 (ejemplo en el cliente)
function convertImageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Subir imagen
async function uploadImageToCloudinary(imageFile) {
  try {
    // Convertir imagen a base64
    const imageBase64 = await convertImageToBase64(imageFile);
    
    // Hacer request al endpoint
    const response = await fetch('http://localhost:3000/api/images/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64: imageBase64, // Ya incluye "data:image/..."
        folder: 'fitbuddy/posts', // Opcional
      }),
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('URL de la imagen:', result.data.url);
      return result.data.url;
    } else {
      console.error('Error:', result.message);
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error al subir imagen:', error);
    throw error;
  }
}

// Uso:
const fileInput = document.querySelector('input[type="file"]');
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    const imageUrl = await uploadImageToCloudinary(file);
    console.log('Imagen subida:', imageUrl);
  }
});
```

## 📱 Ejemplo en React Native

```javascript
import * as ImagePicker from 'expo-image-picker';
import { encode } from 'base64-js';

async function uploadImageFromGallery() {
  try {
    // Pedir permisos
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Se necesitan permisos para acceder a la galería');
      return;
    }

    // Seleccionar imagen
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true, // Importante: incluir base64
    });

    if (!result.cancelled && result.base64) {
      // Crear string base64 con prefijo
      const imageBase64 = `data:image/jpeg;base64,${result.base64}`;
      
      // Subir a Cloudinary
      const response = await fetch('http://localhost:3000/api/images/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: imageBase64,
          folder: 'fitbuddy/posts',
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('URL de la imagen:', data.data.url);
        return data.data.url;
      } else {
        throw new Error(data.message);
      }
    }
  } catch (error) {
    console.error('Error al subir imagen:', error);
    throw error;
  }
}
```

## 📱 Ejemplo en Flutter/Dart

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'dart:io';

Future<String?> uploadImageToCloudinary(File imageFile) async {
  try {
    // Leer imagen como bytes
    List<int> imageBytes = await imageFile.readAsBytes();
    
    // Convertir a base64
    String base64Image = base64Encode(imageBytes);
    
    // Obtener extensión
    String extension = imageFile.path.split('.').last;
    String mimeType = 'image/$extension';
    
    // Crear string base64 con prefijo
    String imageBase64 = 'data:$mimeType;base64,$base64Image';
    
    // Hacer request
    final response = await http.post(
      Uri.parse('http://localhost:3000/api/images/upload'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'imageBase64': imageBase64,
        'folder': 'fitbuddy/posts',
      }),
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['success']) {
        return data['data']['url'];
      }
    }
    
    throw Exception('Error al subir imagen');
  } catch (e) {
    print('Error: $e');
    return null;
  }
}
```

## ⚠️ Formatos de Base64 Soportados

### Formato 1: Con prefijo (Recomendado)
```
data:image/png;base64,iVBORw0KG...
data:image/jpeg;base64,/9j/4AAQSkZJRg...
data:image/jpg;base64,/9j/4AAQSkZJRg...
data:image/webp;base64,UklGRi...
```

### Formato 2: Solo datos base64
```
iVBORw0KG...
/9j/4AAQSkZJRg...
```

## ✅ Formatos de Imagen Permitidos

- `jpg` / `jpeg`
- `png`
- `webp`
- `gif`

## 📋 Notas Importantes

1. **Tamaño máximo**: Cloudinary tiene límites de tamaño según tu plan. Para el plan free, el límite es de 10MB por imagen.

2. **URL retornada**: La URL es permanente y pública. Puedes usarla directamente en tu aplicación.

3. **Carpeta por defecto**: Si no especificas `folder`, se guarda en `"fitbuddy/posts"`.

4. **PublicId**: Si no especificas `publicId`, Cloudinary genera uno automáticamente.

5. **Sobrescritura**: Por defecto, `overwrite: false`, así que no sobrescribe imágenes existentes.

6. **Optimización**: Cloudinary optimiza automáticamente las imágenes (compresión, formatos modernos, etc.).

## 🔧 Uso con Posts

Puedes usar este endpoint para obtener la URL de la imagen y luego crear el post:

```javascript
// 1. Subir imagen
const uploadResponse = await fetch('/api/images/upload', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageBase64: imageBase64,
    folder: 'fitbuddy/posts',
  }),
});

const { data } = await uploadResponse.json();
const imageUrl = data.url;

// 2. Crear post con la URL
const postResponse = await fetch(`/api/posts/${sessionId}/group/${groupId}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    description: 'Mi post',
    imageUrl: imageUrl, // URL de Cloudinary
  }),
});
```

## 🐛 Manejo de Errores

El endpoint retorna códigos de estado HTTP apropiados:

- `200`: Imagen subida exitosamente
- `400`: Error en el request (falta imagenBase64, formato inválido, etc.)
- `500`: Error del servidor o de Cloudinary

Siempre verifica `response.success` antes de usar la URL.

