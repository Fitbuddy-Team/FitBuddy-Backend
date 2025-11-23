'use strict';
import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class AvatarItem extends Model {
    static associate(models) {
      this.belongsToMany(models.Avatar, {
        through: models.AvatarEquippedItem,
        as: 'equippedOn',
        foreignKey: 'itemId'
      });
      this.belongsToMany(models.User, {
  through: models.UserAvatarItem,
  as: 'owners',
  foreignKey: 'itemId',
  otherKey: 'userId'
});
    }
  }

  AvatarItem.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    type: { type: DataTypes.ENUM('hair', 'top', 'bottom', 'medal'), allowNull: false },
    borderSpritePath: { type: DataTypes.STRING, allowNull: false },
    areaSpritePath: { type: DataTypes.STRING, allowNull: true },
    price: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    isDefault: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
  }, {
    sequelize,
    modelName: 'AvatarItem',
    tableName: 'AvatarItems',
    timestamps: true
  });

  return AvatarItem;
};
