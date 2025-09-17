'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ExerciseCategory extends Model {
    static associate(models) {
      this.hasMany(models.Exercise, { foreignKey: 'categoryId', as: 'exercises' });
    }
  }
  ExerciseCategory.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false }
  }, {
    sequelize,
    modelName: 'ExerciseCategory',
    tableName: 'ExerciseCategories',
    timestamps: true
  });
  return ExerciseCategory;
};

