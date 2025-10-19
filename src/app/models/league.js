'use strict';
import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class League extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.hasMany(models.LeagueMember, { 
        foreignKey: 'leagueId', 
        as: 'members', 
        onDelete: 'CASCADE'
      });
    }
  }
  League.init({
    name: DataTypes.STRING,
    minimumPoints: DataTypes.INTEGER,
    maximumPoints: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'League',
  });
  return League;
};