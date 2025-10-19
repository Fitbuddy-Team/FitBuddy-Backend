'use strict';
import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
    class Group extends Model {
        static associate(models) {
            this.belongsToMany(models.User, {
                through: models.GroupMember,
                foreignKey: 'groupId',
                otherKey: 'userId',
                as: 'users'
            });
        }
    }
    Group.init({
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        name: { type: DataTypes.STRING, allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        code: { type: DataTypes.STRING, allowNull: false },
        maxMembers: { type: DataTypes.INTEGER, allowNull: true }
    }, {
        sequelize,
        modelName: 'Group',
        tableName: 'Groups',
        timestamps: true
    });
    return Group;
};