'use strict';
export default {
  async up (queryInterface, Sequelize) {
    // Agregar la nueva columna 'points'
    await queryInterface.addColumn('Sessions', 'points', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });
  },

  async down (queryInterface, Sequelize) {
    // Revertir cambios: eliminar la columna 'points'
    await queryInterface.removeColumn('Sessions', 'points');
  }
};