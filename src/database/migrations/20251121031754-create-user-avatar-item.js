'use strict';
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('UserAvatarItems', {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: Sequelize.INTEGER, allowNull: false },
    itemId: { type: Sequelize.INTEGER, allowNull: false },
    obtainedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    createdAt: { type: Sequelize.DATE, allowNull: false },
    updatedAt: { type: Sequelize.DATE, allowNull: false }
  });
}
export async function down(queryInterface) {
  await queryInterface.dropTable('UserAvatarItems');
}
