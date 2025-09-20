
import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class Routine extends Model {
    static associate(models) {
      // Una rutina pertenece a un usuario
      this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      this.belongsToMany(models.Exercise, {
        through: models.ExerciseRoutine,
        foreignKey: 'routineId',
        otherKey: 'exerciseId',
        as: 'exercises'
      });
      // Más adelante se puede asociar con ejercicios
      // this.belongsToMany(models.Exercise, { through: 'RoutineExercises', foreignKey: 'routineId', as: 'exercises' });
    }
  }
  Routine.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING, allowNull: true }
  }, {
    sequelize,
    modelName: 'Routine',
    tableName: 'Routines',
    timestamps: true 
  });
  return Routine;
};
