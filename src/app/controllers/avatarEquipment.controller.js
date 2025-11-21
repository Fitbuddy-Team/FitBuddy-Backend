import { AvatarEquippedItem, AvatarItem, UserAvatarItem } from '../models/index.js';

export const avatarEquipmentController = {
  // Equipar un ítem
    async equipItem(req, res) {
      const transaction = await AvatarEquippedItem.sequelize.transaction();

      try {
        const { userId, itemId, colorHex } = req.body;
        const avatar = await Avatar.findOne({ where: { userId } });
        if (!avatar) {
          await transaction.rollback();
          return res.status(404).json({ message: 'El usuario no tiene un avatar creado.' });
        }

        // 1️⃣ Validar existencia de item
        const item = await AvatarItem.findByPk(itemId);
        if (!item) {
          await transaction.rollback();
          return res.status(404).json({ message: 'El ítem no existe.' });
        }

        // 2️⃣ Verificar que el usuario tenga ese ítem comprado
        const owned = await UserAvatarItem.findOne({ where: { userId, itemId } });
        if (!owned) {
          await transaction.rollback();
          return res.status(403).json({ message: 'El usuario no posee este ítem.' });
        }

        // 3️⃣ Verificar si ya tiene equipado otro ítem del mismo tipo
        const currentlyEquipped = await AvatarEquippedItem.findOne({
          where: { userId },
          include: [{ model: AvatarItem, as: 'item', where: { type: item.type } }]
        });

        // 4️⃣ Si existe otro del mismo tipo → lo desequipa
        if (currentlyEquipped) {
          await AvatarEquippedItem.destroy({
            where: { id: currentlyEquipped.id },
            transaction
          });
        }

        // 5️⃣ Equipar el nuevo ítem
        await AvatarEquippedItem.create(
          { avatarId: avatar.id, itemId, colorHex: colorHex || null },
          { transaction }
        );

        await transaction.commit();

        res.status(200).json({
          message: `Ítem ${item.type} equipado correctamente.`,
          equippedItem: {
            id: item.id,
            type: item.type,
            colorHex: colorHex || null
          }
        });
      } catch (error) {
        await transaction.rollback();
        console.error('Error al equipar ítem:', error);
        res.status(500).json({ error: error.message });
      }
    },

  // Desequipar
  async unequipItem(req, res) {
    try {
      const { avatarId, itemId } = req.params;
      await AvatarEquippedItem.destroy({ where: { avatarId, itemId } });
      res.status(200).json({ message: 'Ítem removido del avatar.' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener inventario del usuario
  async getInventory(req, res) {
    try {
      const { userId } = req.params;
      const items = await AvatarItem.findAll({
        include: {
          association: 'owners',
          where: { id: userId },
          attributes: []
        }
      });
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

export default avatarEquipmentController;
