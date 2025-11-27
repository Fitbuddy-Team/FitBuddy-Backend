import { Post, Group, Session } from '../models/index.js';
import cloudinary from "../../config/cloudinary.js";

export const postController = {
    // traer los últimos n posts de mi grupo
    getGroupPosts: async (req, res) => {
        try {
            const { groupId } = req.params;  
            const limit = req.query.limit ? parseInt(req.query.limit) : 10;

            // Validar que groupId sea un número
            if (!groupId || isNaN(groupId)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de grupo inválido'
                });
            }
            // Verificar que el grupo existe
            const group = await Group.findByPk(parseInt(groupId));
            if (!group) {
                return res.status(404).json({
                    success: false,
                    message: 'Grupo no encontrado'
                });
            }
            // Obtener los posts del grupo
            const posts = await Post.findAll({
                where: { groupId: parseInt(groupId) },
                include: [
                    { model: Session, as: 'session' }
                ],
                order: [['createdAt', 'DESC']],
                limit
            });

            res.status(200).json({
                success: true,
                message: 'Posts obtenidos exitosamente',
                data: posts
            });

        } catch (error) {
            console.error('Error al obtener posts del grupo:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    },
    // crear un post en mi grupo
    createPost: async (req, res) => {
        try {
            const { sessionId, groupId } = req.params;
            const { description, imageBase64 } = req.body;
            let imageUrl = null;

            // Validar que sessionId y groupId sean números
            if (!sessionId || isNaN(sessionId) || !groupId || isNaN(groupId)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de sesión o grupo inválido'
                });
            }
            // Verificar que la sesión existe
            const session = await Session.findByPk(parseInt(sessionId));
            if (!session) {
                return res.status(404).json({
                    success: false,
                    message: 'Sesión no encontrada'
                });
            }
            // Verificar que el grupo existe
            const group = await Group.findByPk(parseInt(groupId));
            if (!group) {
                return res.status(404).json({
                    success: false,
                    message: 'Grupo no encontrado'
                });
            }

            // Si se proporciona imagen en base64, subirla a Cloudinary
            if (imageBase64) {
                try {
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
                        imageFormat = matches[1];
                        base64Data = matches[2];
                    }

                    // Validar formato de imagen si se especificó
                    const allowedFormats = ["jpg", "jpeg", "png", "webp"];
                    if (imageFormat && !allowedFormats.includes(imageFormat.toLowerCase())) {
                        return res.status(400).json({
                            success: false,
                            message: `Formato de imagen no permitido. Formatos permitidos: ${allowedFormats.join(", ")}`
                        });
                    }

                    // Subir imagen a Cloudinary
                    const uploadResult = await cloudinary.uploader.upload(
                        `data:image/${imageFormat || "auto"};base64,${base64Data}`,
                        {
                            folder: "fitbuddy/posts",
                            resource_type: "image",
                            overwrite: false,
                        }
                    );

                    imageUrl = uploadResult.secure_url;
                } catch (uploadError) {
                    console.error('Error al subir imagen a Cloudinary:', uploadError);
                    return res.status(500).json({
                        success: false,
                        message: 'Error al subir imagen a Cloudinary',
                        error: uploadError.message
                    });
                }
            }

            // Crear el post
            const newPost = await Post.create({
                sessionId: parseInt(sessionId),
                groupId: parseInt(groupId),
                description,
                imageUrl
            });
            
            res.status(201).json({
                success: true,
                message: 'Post creado exitosamente',
                data: newPost
            });
        } catch (error) {
            console.error('Error al crear post:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    },
    // eliminar un post
    deletePost: async (req, res) => {
        try {
            const { postId } = req.params;

            // Validar que postId sea un número
            if (!postId || isNaN(postId)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de post inválido'
                });
            }
            // Verificar que el post existe
            const post = await Post.findByPk(parseInt(postId));
            if (!post) {
                return res.status(404).json({
                    success: false,
                    message: 'Post no encontrado'
                });
            }
            // Eliminar el post
            await post.destroy();

            res.status(200).json({
                success: true,
                message: 'Post eliminado exitosamente'
            });
        } catch (error) {
            console.error('Error al eliminar post:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
};

export default postController;