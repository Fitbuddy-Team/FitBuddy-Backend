
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
      // Un usuario puede pertenecer a muchos grupos (a través de GroupMember)
      this.belongsToMany(models.Group, {
        through: models.GroupMember,
        foreignKey: 'userId',
        otherKey: 'groupId',
        as: 'groups'
      });
      this.hasMany(models.GroupMember, { 
        foreignKey: 'userId', 
        as: 'memberships' 
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
    timestamps: true
  });
  return User;
};
