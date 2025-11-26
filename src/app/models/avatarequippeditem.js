'use strict';
import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class AvatarEquippedItem extends Model {
    static associate(models) {
      this.belongsTo(models.Avatar, { foreignKey: 'avatarId', as: 'avatar' });
      this.belongsTo(models.AvatarItem, { foreignKey: 'itemId', as: 'item' });
    }
  }

  AvatarEquippedItem.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    avatarId: { type: DataTypes.INTEGER, allowNull: false },
    itemId: { type: DataTypes.INTEGER, allowNull: false },
    colorHex: { type: DataTypes.STRING, allowNull: true }
  }, {
    sequelize,
    modelName: 'AvatarEquippedItem',
    tableName: 'AvatarEquippedItems',
    timestamps: true
  });

  return AvatarEquippedItem;
};
