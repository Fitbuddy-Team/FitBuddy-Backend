'use strict';

export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('LeagueMembers', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      leagueId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Leagues', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      points: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('LeagueMembers');
  }
};