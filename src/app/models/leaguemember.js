'use strict';
import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class LeagueMember extends Model {
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      this.belongsTo(models.League, { foreignKey: 'leagueId', as: 'league' });
    }
  }

  LeagueMember.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    leagueId: { type: DataTypes.INTEGER, allowNull: false },
    points: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
  }, {
    sequelize,
    modelName: 'LeagueMember',
    tableName: 'LeagueMembers',
    timestamps: true
  });

  return LeagueMember;
};