'use strict';
import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class UserAvatarItem extends Model {}

  UserAvatarItem.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    itemId: { type: DataTypes.INTEGER, allowNull: false },
    obtainedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  }, {
    sequelize,
    modelName: 'UserAvatarItem',
    tableName: 'UserAvatarItems',
    timestamps: true
  });

  return UserAvatarItem;
};
