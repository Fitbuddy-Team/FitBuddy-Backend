'use strict';
import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
    class GroupMember extends Model {
        static associate(models) {
            this.belongsTo(models.Group, { foreignKey: 'groupId', as: 'group', onDelete: 'CASCADE' });
            this.belongsTo(models.User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });
        }
    }
    GroupMember.init({
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        userId: { type: DataTypes.INTEGER, allowNull: false },
        groupId: { type: DataTypes.INTEGER, allowNull: false },
        points: { type: DataTypes.INTEGER, allowNull: true }
    }, {
        sequelize,
        modelName: 'GroupMember',
        tableName: 'GroupMembers',
        timestamps: true
    });
    return GroupMember;
};