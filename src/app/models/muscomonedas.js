'use strict';
import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class Muscomonedas extends Model {
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });
    }
  }

  Muscomonedas.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    amount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
  }, {
    sequelize,
    modelName: 'Muscomonedas',
    tableName: 'Muscomonedas',
    timestamps: true
  });

  return Muscomonedas;
};

