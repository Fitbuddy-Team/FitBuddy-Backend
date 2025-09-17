'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ExerciseRoutine extends Model {
    static associate(models) {
      this.belongsTo(models.Routine, { foreignKey: 'routineId', as: 'routine' });
      this.belongsTo(models.Exercise, { foreignKey: 'exerciseId', as: 'exercise' });
    }
  }
  ExerciseRoutine.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    routineId: { type: DataTypes.INTEGER, allowNull: false },
    exerciseId: { type: DataTypes.INTEGER, allowNull: false }
  }, {
    sequelize,
    modelName: 'ExerciseRoutine',
    tableName: 'ExerciseRoutines',
    timestamps: true
  });
  return ExerciseRoutine;
};