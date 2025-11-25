import { AvatarEquippedItem, AvatarItem, UserAvatarItem, Avatar } from '../models/index.js';

export const avatarEquipmentController = {
  // Equipar un ítem
  async equipItem(req, res) {
  const transaction = await AvatarEquippedItem.sequelize.transaction();

  try {
    const { userId } = req.params;
    const { itemId, colorHex } = req.body;

    // Buscar el avatar del usuario
    const avatar = await Avatar.findOne({ where: { userId } });
    if (!avatar) {
      await transaction.rollback();
      return res.status(404).json({ message: 'El usuario no tiene un avatar creado.' });
    }

    // 1️⃣ Validar existencia del ítem
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

    // 3️⃣ Verificar si el avatar ya tiene equipado otro ítem del mismo tipo
    const currentlyEquipped = await AvatarEquippedItem.findOne({
      where: { avatarId: avatar.id },
      include: [
        {
          model: AvatarItem,
          as: 'item',
          where: { type: item.type }
        }
      ]
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

    return res.status(200).json({
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
}
,

  // Desequipar
  async unequipItem(req, res) {
    try {
     const { userId } = req.params;
     const { itemId } = req.body;
     const avatar = await Avatar.findOne({ where: { userId } });
        if (!avatar) {
          await transaction.rollback();
          return res.status(404).json({ message: 'El usuario no tiene un avatar creado.' });
        }
      await AvatarEquippedItem.destroy({ where: { avatarId: avatar.id, itemId } });
      res.status(200).json({ message: 'Ítem removido del avatar.' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  // función que cambia el color de un ítem equipado
  async changeEquippedItemColor(req, res) {
    try {
      const { userId, } = req.params;
      const { itemId, colorHex } = req.body;

      const avatar = await Avatar.findOne({ where: { userId } });
      if (!avatar) {
        return res.status(404).json({ message: 'El usuario no tiene un avatar creado.' });
      }

      const equippedItem = await AvatarEquippedItem.findOne({
        where: { avatarId: avatar.id, itemId }
      });

      if (!equippedItem) {
        return res.status(404).json({ message: 'El ítem no está equipado en el avatar.' });
      }

      equippedItem.colorHex = colorHex;
      await equippedItem.save();

      res.status(200).json({ message: 'Color del ítem equipado actualizado.', equippedItem });
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
