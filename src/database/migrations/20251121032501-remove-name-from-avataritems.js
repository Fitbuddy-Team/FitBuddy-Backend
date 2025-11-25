'use strict';

export async function up(queryInterface) {
  await queryInterface.removeColumn('AvatarItems', 'name');
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.addColumn('AvatarItems', 'name', {
    type: Sequelize.STRING,
    allowNull: false,
  });
}
