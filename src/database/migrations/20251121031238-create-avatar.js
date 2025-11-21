'use strict';
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('Avatars', {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: Sequelize.INTEGER, allowNull: false },
    gender: { type: Sequelize.ENUM('male', 'female'), allowNull: false },
    bodyBorderPath: { type: Sequelize.STRING, allowNull: false },
    bodyAreaPath: { type: Sequelize.STRING, allowNull: false },
    bodyColorHex: { type: Sequelize.STRING, allowNull: false },
    createdAt: { type: Sequelize.DATE, allowNull: false },
    updatedAt: { type: Sequelize.DATE, allowNull: false }
  });
}
export async function down(queryInterface) {
  await queryInterface.dropTable('Avatars');
}