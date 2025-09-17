'use strict';
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Sets', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      exerciseRoutineId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'ExerciseRoutines', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      exerciseSessionId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'ExerciseSessions', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      status: { type: Sequelize.STRING },
      reps: { type: Sequelize.INTEGER },
      weight: { type: Sequelize.FLOAT },
      restTime: { type: Sequelize.INTEGER },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('Sets');
  }
};
