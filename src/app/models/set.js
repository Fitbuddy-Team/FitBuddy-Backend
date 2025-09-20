
import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class Set extends Model {
    static associate(models) {
      // Un Set puede pertenecer a un ejercicio de rutina
      this.belongsTo(models.ExerciseRoutine, {
        foreignKey: 'exerciseRoutineId',
        as: 'exerciseRoutine'
      });

      // Un Set puede pertenecer a un ejercicio de sesión
      this.belongsTo(models.ExerciseSession, {
        foreignKey: 'exerciseSessionId',
        as: 'exerciseSession'
      });
    }
  }
  Set.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    exerciseRoutineId: { type: DataTypes.INTEGER, allowNull: true },
    exerciseSessionId: { type: DataTypes.INTEGER, allowNull: true },
    order: { type: DataTypes.INTEGER },
    status: { type: DataTypes.STRING },
    reps: { type: DataTypes.INTEGER },
    weight: { type: DataTypes.FLOAT },
    restTime: { type: DataTypes.INTEGER }
  }, {
    sequelize,
    modelName: 'Set',
    tableName: 'Sets',
    timestamps: true
  });
  return Set;
};
