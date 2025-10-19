
import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // Un usuario tiene muchas rutinas, sesiones y ejercicios
      this.hasMany(models.Routine, { 
        foreignKey: 'userId', 
        as: 'routines', 
        onDelete: 'CASCADE', 
        hooks: true 
      });
      this.hasMany(models.Session, { 
        foreignKey: 'userId', 
        as: 'sessions', 
        onDelete: 'CASCADE', 
        hooks: true 
      });
      this.hasMany(models.Exercise, { 
        foreignKey: 'userId', 
        as: 'exercises', 
        onDelete: 'SET NULL',
        hooks: true 
      });
      this.hasOne(models.LeagueMember, { 
        foreignKey: 'userId', 
        as: 'leagueMember', 
        onDelete: 'CASCADE'
      });
    }
  }
  User.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    weight: DataTypes.FLOAT,
    height: DataTypes.FLOAT,
    auth0_id: { type: DataTypes.STRING, allowNull: false, unique: true } 
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'Users',
    timestamps: true,
    hooks: {
      // Hook: al crear un usuario, asignarlo a la liga con menos puntos
      async afterCreate(user, options) {
        const { League, LeagueMember } = sequelize.models;

        // Busca la liga con menor "minimumPoints"
        const lowestLeague = await League.findOne({
          order: [['minimumPoints', 'ASC']]
        });

        if (lowestLeague) {
          await LeagueMember.create({
            userId: user.id,
            leagueId: lowestLeague.id,
            points: 0
          });
        }}
      }
  });
  return User;
};
