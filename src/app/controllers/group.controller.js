import crypto from 'crypto';
import { Group, GroupMember, sequelize } from '../models/index.js';

export const groupController = {
    createGroup: async (req, res) => {
      const { userId } = req.params;
      const { name, description, maxMembers } = req.body;

      if (!name || maxMembers === undefined) {
        return res.status(400).json({ message: 'Faltan campos obligatorios: name y maxMembers.' });
      }

      const t = await sequelize.transaction();
      try {
        // Generar código único (hex de 6 chars)
        let code;
        let exists;
        do {
          code = crypto.randomBytes(3).toString('hex').toUpperCase();
          exists = await Group.findOne({ where: { code }, transaction: t });
        } while (exists);

        const group = await Group.create({
          name,
          description: description || null,
          code,
          maxMembers: Number(maxMembers)
        }, { transaction: t });

        await GroupMember.create({
          userId: Number(userId),
          groupId: group.id,
          points: 0
        }, { transaction: t });

        await t.commit();
        return res.status(201).json({ message: 'Grupo creado exitosamente', group });
      } catch (err) {
        await t.rollback();
        return res.status(500).json({ message: err.message });
      }
    }
};

export default groupController;