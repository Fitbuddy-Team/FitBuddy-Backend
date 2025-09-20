'use strict';
import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class ExerciseMuscleGroup extends Model {
    static associate(models) {
      // Relación con Exercise
      this.belongsTo(models.Exercise, { foreignKey: 'exerciseId', as: 'exercise' });

      // Relación con MuscleGroup
      this.belongsTo(models.MuscleGroup, { foreignKey: 'muscleGroupId', as: 'muscleGroup' });
    }
  }
  ExerciseMuscleGroup.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    exerciseId: { type: DataTypes.INTEGER, allowNull: false },
    muscleGroupId: { type: DataTypes.INTEGER, allowNull: false }
  }, {
    sequelize,
    modelName: 'ExerciseMuscleGroup',
    tableName: 'ExerciseMuscleGroups',
    timestamps: true
  });
  return ExerciseMuscleGroup;
};
