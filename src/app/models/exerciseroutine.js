import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class ExerciseRoutine extends Model {
    static associate(models) {
      this.belongsTo(models.Routine, { foreignKey: 'routineId', as: 'routine' });
      this.belongsTo(models.Exercise, { foreignKey: 'exerciseId', as: 'exercise' });
      this.hasMany(models.Set, { foreignKey: 'exerciseRoutineId', as: 'sets' });
    }
  }
  ExerciseRoutine.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    routineId: { type: DataTypes.INTEGER, allowNull: false },
    exerciseId: { type: DataTypes.INTEGER, allowNull: false },
    order: { type: DataTypes.INTEGER },
  }, {
    sequelize,
    modelName: 'ExerciseRoutine',
    tableName: 'ExerciseRoutines',
    timestamps: true
  });
  return ExerciseRoutine;
};