'use strict';
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('AvatarItems', {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: Sequelize.STRING, allowNull: false },
    type: { type: Sequelize.ENUM('hair', 'top', 'bottom', 'medal'), allowNull: false },
    borderSpritePath: { type: Sequelize.STRING, allowNull: false },
    areaSpritePath: { type: Sequelize.STRING, allowNull: true },
    price: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
    isDefault: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
    createdAt: { type: Sequelize.DATE, allowNull: false },
    updatedAt: { type: Sequelize.DATE, allowNull: false }
  });
}
export async function down(queryInterface) {
  await queryInterface.dropTable('AvatarItems');
}
