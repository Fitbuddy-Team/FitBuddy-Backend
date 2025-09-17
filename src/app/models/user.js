'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      this.hasMany(models.Exercise, { foreignKey: 'userId', as: 'exercises' });
    }
  }
  User.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    weight: DataTypes.FLOAT,
    height: DataTypes.FLOAT
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'Users',
    timestamps: true,
     validate: {
    eitherRoutineOrSession() {
      if (!this.exerciseRoutineId && !this.exerciseSessionId) {
        throw new Error('Un Set debe pertenecer a ExerciseRoutine o ExerciseSession');
      }
      if (this.exerciseRoutineId && this.exerciseSessionId) {
        throw new Error('Un Set no puede pertenecer a ambos ExerciseRoutine y ExerciseSession');
      }
    }
  }
  });
  
  return User;
};
