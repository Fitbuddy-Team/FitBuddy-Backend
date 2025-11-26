'use strict';
import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class Push extends Model {
    static associate(models) {
      this.belongsTo(models.Group, { foreignKey: 'groupId', as: 'group', onDelete: 'CASCADE' });
      this.belongsTo(models.User, { foreignKey: 'senderId', as: 'sender', onDelete: 'CASCADE' });
      this.belongsTo(models.User, { foreignKey: 'receiverId', as: 'receiver', onDelete: 'CASCADE' });
    }
  }
  Push.init({
    senderId: DataTypes.INTEGER,
    receiverId: DataTypes.INTEGER,
    groupId: DataTypes.INTEGER,
    seen: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Push',
    timestamps: true
  });
  return Push;
};