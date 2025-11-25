import { Push, User, Group, GroupMember, Session } from '../models/index.js';
import { Op } from 'sequelize';

export const pushController = {
    // crear un push a un usuario de mi grupo
    createPush: async (req, res) => {
        try {
            const { senderId, receiverId, groupId } = req.params;

            // Validar que los IDs sean números
            if (isNaN(senderId) || isNaN(receiverId) || isNaN(groupId)) {
                return res.status(400).json({
                    success: false,
                    message: 'IDs inválidos'
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

            // Fecha límite: hace 24 horas
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            // Verificar si el receiver ya tiene un push en este grupo en las últimas 24h
            const recentPush = await Push.findOne({
                where: {
                    receiverId,
                    groupId,
                    createdAt: {
                        [Op.gte]: twentyFourHoursAgo
                    }
                }
            });
            if (recentPush) {
                return res.status(400).json({
                    success: false,
                    message: 'Este usuario ya recibió un empujón en este grupo en las últimas 24 horas'
                });
            }
            // Crear nuevo push
            const newPush = await Push.create({
                senderId,
                receiverId,
                groupId,
                seen: false
            });

            return res.status(201).json({
                success: true,
                message: 'Push creado exitosamente',
                data: newPush
            });
        } catch (error) {
            console.error('Error al crear push:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    },
    // obtener un push no visto para un usuario en un grupo
    getPush: async (req, res) => {
        try {
            const { receiverId, groupId } = req.params;

            // Validar que los IDs sean números
            if (isNaN(receiverId) || isNaN(groupId)) {
                return res.status(400).json({
                    success: false,
                    message: 'IDs inválidos'
                });
            }
            // Obtener pushs no vistos
            const unseenPushes = await Push.findAll({
                where: {
                    receiverId,
                    groupId,
                    seen: false
                }, include: [
                    { model: User, as: 'sender'}
                ]
            });

            return res.status(200).json({
                success: true,
                message: 'Push obtenidos exitosamente',
                data: unseenPushes
            });
        } catch (error) {
            console.error('Error al obtener pushs:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    },
    // marcar un push como visto
    updatePush: async (req, res) => {
        try {
            const { receiverId, groupId } = req.params;

            // Validar que los IDs sean números
            if (isNaN(receiverId) || isNaN(groupId)) {
                return res.status(400).json({
                    success: false,
                    message: 'IDs inválidos'
                });
            }
            // Actualizar push no visto a visto
            const updated = await Push.update(
                { seen: true },
                {
                    where: {
                        receiverId,
                        groupId,
                        seen: false
                    }
                }
            );

            return res.status(200).json({
                success: true,
                message: 'Push marcado como vistos exitosamente',
                data: updated
            });
        } catch (error) {
            console.error('Error al actualizar push:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
};

export default pushController;