'use strict';
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ExerciseMuscleGroups', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      exerciseId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Exercises', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      muscleGroupId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'MuscleGroups', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
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
    await queryInterface.dropTable('ExerciseMuscleGroups');
  }
};
