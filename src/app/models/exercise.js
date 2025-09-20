'use strict';
import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class Exercise extends Model {
    static associate(models) {
      this.belongsTo(models.ExerciseCategory, { foreignKey: 'categoryId', as: 'category' });
      this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      this.belongsToMany(models.MuscleGroup, {
        through: models.ExerciseMuscleGroup,
        foreignKey: 'exerciseId',
        otherKey: 'muscleGroupId',
        as: 'muscles'
      });
      this.belongsToMany(models.Routine, {
        through: models.ExerciseRoutine,
        foreignKey: 'exerciseId',
        otherKey: 'routineId',
        as: 'routines'
      });
    }
  }
  Exercise.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    userMade: { type: DataTypes.BOOLEAN, defaultValue: false },
    categoryId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: true }
  }, {
    sequelize,
    modelName: 'Exercise',
    tableName: 'Exercises',
    timestamps: true
  });
  return Exercise;
};
