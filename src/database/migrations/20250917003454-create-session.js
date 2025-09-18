'use strict';
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Sessions', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      routineId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Routines', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      date: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      duration: { type: Sequelize.INTEGER },
      status: { type: Sequelize.STRING },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('Sessions');
  }
};
