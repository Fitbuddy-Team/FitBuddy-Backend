import { AvatarItem, UserAvatarItem } from '../models/index.js';

export const storeController = {
  // Listar ítems por tipo (filtra por userId)
  async getItemsByType(req, res) {
    try {
      const { type, userId } = req.params;

      const items = await AvatarItem.findAll({ where: { type } });
      const owned = await UserAvatarItem.findAll({ where: { userId }, attributes: ['itemId'] });
      const ownedIds = owned.map(o => o.itemId);

      const result = items.map(item => ({
        id: item.id,
        type: item.type,
        borderSpritePath: item.borderSpritePath,
        areaSpritePath: item.areaSpritePath,
        price: ownedIds.includes(item.id) ? 0 : item.price,
        isOwned: ownedIds.includes(item.id)
      }));

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Comprar ítem
    async purchaseItem(req, res) {
      const transaction = await UserAvatarItem.sequelize.transaction();
    
      try {
        const { userId, itemId } = req.body;
        
        // Validar existencia de item
        const item = await AvatarItem.findByPk(itemId);
        if (!item) {
          await transaction.rollback();
          return res.status(404).json({ message: 'El ítem no existe.' });
        }
      
        // Verificar si el usuario ya lo tiene
        const owned = await UserAvatarItem.findOne({ where: { userId, itemId } });
        if (owned) {
          await transaction.rollback();
          return res.status(409).json({ message: 'El ítem ya fue comprado.' });
        }
      
        // Obtener muscomonedas del usuario
        const userCoins = await Muscomonedas.findOne({ where: { userId } });
        if (!userCoins) {
          await transaction.rollback();
          return res.status(404).json({ message: 'El usuario no tiene registro de muscomonedas.' });
        }
      
        // Validar saldo
        if (userCoins.amount < item.price) {
          await transaction.rollback();
          return res.status(400).json({
            message: 'Saldo insuficiente de muscomonedas.',
            currentBalance: userCoins.amount,
            required: item.price
          });
        }
      
        // Descontar precio
        userCoins.amount -= item.price;
        await userCoins.save({ transaction });
      
        // Registrar compra
        await UserAvatarItem.create({ userId, itemId }, { transaction });
      
        await transaction.commit();
      
        return res.status(201).json({
          message: 'Compra exitosa.',
          itemId,
          newBalance: userCoins.amount
        });
      } catch (error) {
        await transaction.rollback();
        console.error('Error en compra:', error);
        res.status(500).json({ error: error.message });
      }
    }
};  

export default storeController;
