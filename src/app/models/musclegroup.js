'use strict';
import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class MuscleGroup extends Model {
    static associate(models) {
      this.belongsToMany(models.Exercise, {
        through: models.ExerciseMuscleGroup,
        foreignKey: 'muscleGroupId',
        otherKey: 'exerciseId',
        as: 'exercises'
      });
    }
  }
  MuscleGroup.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false }
  }, {
    sequelize,
    modelName: 'MuscleGroup',
    tableName: 'MuscleGroups',
    timestamps: true
  });
  return MuscleGroup;
};

