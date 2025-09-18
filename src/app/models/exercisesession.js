'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ExerciseSession extends Model {
    static associate(models) {
      // Una fila pertenece a una sesión
      this.belongsTo(models.Session, { foreignKey: 'sessionId', as: 'session' });

      // Una fila pertenece a un ejercicio
      this.belongsTo(models.Exercise, { foreignKey: 'exerciseId', as: 'exercise' });
    }
  }
  ExerciseSession.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    sessionId: { type: DataTypes.INTEGER, allowNull: false },
    exerciseId: { type: DataTypes.INTEGER, allowNull: false },
    order: { type: DataTypes.INTEGER }
  }, {
    sequelize,
    modelName: 'ExerciseSession',
    tableName: 'ExerciseSessions',
    timestamps: true
  });
  return ExerciseSession;
};
