import { AvatarItem, AvatarEquippedItem, Session } from '../models/index.js';
import { Op } from 'sequelize';

export async function updateAvatarAppearance(avatar, userId) {
  // 🔹 Calcular puntos de la última semana
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const sessions = await Session.findAll({
    where: { userId, date: { [Op.gte]: oneWeekAgo } },
    attributes: ['points']
  });

  const weeklyPoints = sessions.reduce((sum, s) => sum + (s.points || 0), 0);
  const muscularThreshold = 50;
  const bodyCondition = weeklyPoints >= muscularThreshold ? 'fit' : 'skinny';
  const genderLabel = avatar.gender === 'female' ? 'girl' : 'boy';

  // 🔄 Actualizar cuerpo
  const newBodyBorderPath = `/sprites/base/lines/${bodyCondition}_${genderLabel}.png`;
  const newBodyAreaPath = `/sprites/base/colors/${bodyCondition}_${genderLabel}.png`;

  const bodyChanged =
    avatar.bodyBorderPath !== newBodyBorderPath ||
    avatar.bodyAreaPath !== newBodyAreaPath;

  if (bodyChanged) {
    avatar.bodyBorderPath = newBodyBorderPath;
    avatar.bodyAreaPath = newBodyAreaPath;
    await avatar.save();
  }

  // 👙 Actualizar ropa interior
  const underwear = await AvatarItem.findOne({
    where: {
      type: 'bottom',
      borderSpritePath: `/base/underwear_colors/${bodyCondition}_${genderLabel}.png`
    }
  });

  if (underwear) {
    const oldUnderwear = await AvatarEquippedItem.findOne({
      where: { avatarId: avatar.id },
      include: [{ model: AvatarItem, as: 'item', where: { type: 'bottom' } }]
    });

    if (oldUnderwear) {
      await AvatarEquippedItem.destroy({ where: { id: oldUnderwear.id } });
    }

    await AvatarEquippedItem.create({
      avatarId: avatar.id,
      itemId: underwear.id,
      colorHex: null
    });
  }

  return { weeklyPoints, bodyCondition, bodyChanged };
}
