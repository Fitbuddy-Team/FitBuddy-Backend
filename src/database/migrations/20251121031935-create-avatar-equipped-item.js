'use strict';
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('AvatarEquippedItems', {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    avatarId: { type: Sequelize.INTEGER, allowNull: false },
    itemId: { type: Sequelize.INTEGER, allowNull: false },
    colorHex: { type: Sequelize.STRING, allowNull: true },
    createdAt: { type: Sequelize.DATE, allowNull: false },
    updatedAt: { type: Sequelize.DATE, allowNull: false }
  });
}
export async function down(queryInterface) {
  await queryInterface.dropTable('AvatarEquippedItems');
}
