'use strict';
import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class Avatar extends Model {
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      this.belongsToMany(models.AvatarItem, {
        through: models.AvatarEquippedItem,
        as: 'equippedItems',
        foreignKey: 'avatarId',
        otherKey: 'itemId'
      });
    }
  }

  Avatar.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    gender: { type: DataTypes.ENUM('male', 'female'), allowNull: false },
    bodyBorderPath: { type: DataTypes.STRING, allowNull: false },
    bodyAreaPath: { type: DataTypes.STRING, allowNull: false },
    bodyColorHex: { type: DataTypes.STRING, allowNull: false }
  }, {
    sequelize,
    modelName: 'Avatar',
    tableName: 'Avatars',
    timestamps: true
  });

  return Avatar;
};
