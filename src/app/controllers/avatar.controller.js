import { Avatar, AvatarEquippedItem, AvatarItem, Session } from '../models/index.js';

export const avatarController = {
  // Crear un avatar
    async create(req, res) {
      try {
        const { userId, gender, bodyBorderPath, bodyAreaPath, bodyColorHex } = req.body;

        const newAvatar = await Avatar.create({
          userId,
          gender,
          bodyBorderPath,
          bodyAreaPath,
          bodyColorHex
        });

        return res.status(201).json(newAvatar);
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
      }
    },

    async getByUser(req, res) {
        try {
          const { userId } = req.params;
        
             const avatar = await Avatar.findOne({
            where: { userId },
            include: [
              {
                model: AvatarItem,
                as: 'equippedItems',
                through: { attributes: ['colorHex'] }
              }
            ]
          });
    
             if (!avatar) {
            return res.json({
              hasAvatar: false,
              message: 'El usuario aún no tiene un avatar creado.'
            });
          }
    
             // 🔹 Calcular puntos de la última semana
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
             const sessions = await Session.findAll({
            where: {
              userId,
              date: { [Op.gte]: oneWeekAgo }
            },
            attributes: ['points']
          });
    
             const weeklyPoints = sessions.reduce((sum, s) => sum + (s.points || 0), 0);
    
             // 🔹 Determinar cuerpo según puntos
          const muscularThreshold = 50;
          const gender = avatar.gender === 'female' ? 'girl' : 'boy';
          const bodyCondition = weeklyPoints >= muscularThreshold ? 'fit' : 'skinny';
          const newBodyBorderPath = `/sprites/base/lines/${bodyCondition}_${gender}.png`;
          const newBodyAreaPath = `/sprites/base/colors/${bodyCondition}_${gender}.png`;
    
             // 🔹 Actualizar avatar solo si cambió el cuerpo
          const needsUpdate =
            avatar.bodyBorderPath !== newBodyBorderPath ||
            avatar.bodyAreaPath !== newBodyAreaPath;
    
             if (needsUpdate) {
            avatar.bodyBorderPath = newBodyBorderPath;
            avatar.bodyAreaPath = newBodyAreaPath;
            await avatar.save();
          }
    
             res.status(200).json({
            message: needsUpdate
              ? 'Avatar actualizado según rendimiento semanal.'
              : 'Avatar sin cambios.',
            weeklyPoints,
            avatar
          });
        } catch (error) {
          console.error('Error al obtener o actualizar avatar:', error);
          res.status(500).json({ error: error.message });
        }
    },  

    async getByUser(req, res) {
        try {
            const { userId } = req.params;

            const avatar = await Avatar.findOne({
            where: { userId },
            include: [{
                model: AvatarItem,
                as: 'equippedItems',
                through: { attributes: ['colorHex'] }
            }]
            });
          
            if (!avatar) {
            return res.json({
                hasAvatar: false,
                avatar: null,
                equippedItems: []
            });
            }
          
            res.json({
            hasAvatar: true,
            avatar,
            equippedItems: avatar.equippedItems || []
            });
        } catch (error) 
        {
            res.status(500).json({ error: error.message });
        }
    },

    async update(req, res) {
        try {
          const { userId } = req.params;
          const { gender, bodyBorderPath, bodyAreaPath, bodyColorHex } = req.body;

          const avatar = await Avatar.findOne({ where: { userId } });

          // ⚙️ Si no existe, no es un error: se devuelve hasAvatar: false
          if (!avatar) {
            return res.json({
              hasAvatar: false,
              message: 'El usuario aún no tiene un avatar creado.'
            });
          }

          // 🔧 Actualizar solo los campos que vengan en el body
          if (gender !== undefined) avatar.gender = gender;
          if (bodyBorderPath !== undefined) avatar.bodyBorderPath = bodyBorderPath;
          if (bodyAreaPath !== undefined) avatar.bodyAreaPath = bodyAreaPath;
          if (bodyColorHex !== undefined) avatar.bodyColorHex = bodyColorHex;

          await avatar.save();

          const updated = await Avatar.findOne({
            where: { userId },
            include: [{
              model: AvatarItem,
              as: 'equippedItems',
              through: { attributes: ['colorHex'] }
            }]
          });

          res.status(200).json({
            message: 'Avatar actualizado correctamente.',
            avatar: updated
          });

        } catch (error) {
          console.error('Error al actualizar el avatar:', error);
          res.status(500).json({ error: error.message });
        }
    }
};

export default avatarController;