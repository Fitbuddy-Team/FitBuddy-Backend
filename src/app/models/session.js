
import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class Session extends Model {
    static associate(models) {
      // Una sesión pertenece a un usuario
      this.belongsTo(models.User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });

      // Una sesión puede estar asociada a una rutina
      this.belongsTo(models.Routine, { foreignKey: 'routineId', as: 'routine' });

      // Una sesión puede tener varios ejercicios (a través de ExerciseSession)
      this.belongsToMany(models.Exercise, {
        through: models.ExerciseSession,
        foreignKey: 'sessionId',
        otherKey: 'exerciseId',
        as: 'exercises'
      });
    }
  }
  Session.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    routineId: { type: DataTypes.INTEGER, allowNull: true },
    date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    duration: { type: DataTypes.INTEGER }, // en minutos
    status: { type: DataTypes.STRING },
    points: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
  }, {
    sequelize,
    modelName: 'Session',
    tableName: 'Sessions',
    timestamps: true
  });
  return Session;
};
