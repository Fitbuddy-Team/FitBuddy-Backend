import cloudinary from "../../config/cloudinary.js";

/**
 * Endpoint para subir una imagen en base64 a Cloudinary
 * Recibe: { imageBase64: string, folder?: string, publicId?: string }
 * Retorna: { success: boolean, url: string, publicId: string }
 */
export const imageController = {
  uploadBase64: async (req, res) => {
    try {
      const { imageBase64, folder = "fitbuddy/posts", publicId } = req.body;

      // Validar que se recibió la imagen en base64
      if (!imageBase64) {
        return res.status(400).json({
          success: false,
          message: "Se requiere el campo 'imageBase64' con la imagen codificada en base64"
        });
      }

      // Validar formato de base64
      // Puede venir como "data:image/png;base64,iVBORw0KG..." o solo "iVBORw0KG..."
      let base64Data = imageBase64;
      let imageFormat = null;

      // Si viene con el prefijo data:image/..., extraer solo los datos
      if (imageBase64.includes("data:image/")) {
        const matches = imageBase64.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
        if (!matches) {
          return res.status(400).json({
            success: false,
            message: "Formato de base64 inválido. Debe ser 'data:image/tipo;base64,datos' o solo los datos base64"
          });
        }
        imageFormat = matches[1]; // png, jpg, jpeg, webp, etc.
        base64Data = matches[2]; // Solo los datos base64
      }

      // Validar formato de imagen si se especificó
      const allowedFormats = ["jpg", "jpeg", "png", "webp", "gif"];
      if (imageFormat && !allowedFormats.includes(imageFormat.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: `Formato de imagen no permitido. Formatos permitidos: ${allowedFormats.join(", ")}`
        });
      }

      // Configurar opciones para Cloudinary
      const uploadOptions = {
        folder: folder,
        resource_type: "image",
        overwrite: false, // No sobrescribir si existe
      };

      // Si se especifica un publicId, agregarlo
      if (publicId) {
        uploadOptions.public_id = publicId;
      }

      // Si se detectó formato, agregarlo
      if (imageFormat) {
        uploadOptions.format = imageFormat;
      }

      // Subir imagen a Cloudinary desde base64
      const uploadResult = await cloudinary.uploader.upload(
        `data:image/${imageFormat || "auto"};base64,${base64Data}`,
        uploadOptions
      );

      // Retornar la URL y datos de la imagen
      res.status(200).json({
        success: true,
        message: "Imagen subida exitosamente a Cloudinary",
        data: {
          url: uploadResult.secure_url, // URL HTTPS de la imagen
          publicId: uploadResult.public_id, // ID público en Cloudinary
          width: uploadResult.width,
          height: uploadResult.height,
          format: uploadResult.format,
          bytes: uploadResult.bytes, // Tamaño en bytes
          folder: uploadResult.folder || folder,
        }
      });

    } catch (error) {
      console.error("Error al subir imagen a Cloudinary:", error);
      
      // Manejar errores específicos de Cloudinary
      if (error.http_code) {
        return res.status(error.http_code || 500).json({
          success: false,
          message: "Error al subir imagen a Cloudinary",
          error: error.message || "Error desconocido de Cloudinary"
        });
      }

      res.status(500).json({
        success: false,
        message: "Error interno del servidor al procesar la imagen",
        error: error.message
      });
    }
  }
};

