'use strict';
export default {
  async up (queryInterface, Sequelize) {
    // Eliminar la columna 'password' si existe
    await queryInterface.removeColumn('Users', 'password');

    // Agregar la nueva columna 'auth0_id'
    await queryInterface.addColumn('Users', 'auth0_id', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    });
  },

  async down (queryInterface, Sequelize) {
    // Revertir cambios: volver a crear password y eliminar auth0_id
    await queryInterface.addColumn('Users', 'password', {
      type: Sequelize.STRING
    });

    await queryInterface.removeColumn('Users', 'auth0_id');
  }
};
