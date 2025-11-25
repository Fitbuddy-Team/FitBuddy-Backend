'use strict';
import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class Post extends Model {
    static associate(models) {
      this.belongsTo(models.Group, { foreignKey: 'groupId', as: 'group', onDelete: 'CASCADE' });
      this.belongsTo(models.Session, { foreignKey: 'sessionId', as: 'session', onDelete: 'CASCADE' });
    }
  }
  Post.init({
    groupId: DataTypes.INTEGER,
    sessionId: DataTypes.INTEGER,
    description: DataTypes.STRING,
    imageUrl: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Post',
    tableName: 'Posts',
    timestamps: true
  });
  return Post;
};