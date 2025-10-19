'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Leagues', [
      {
        name: 'Bronce',
        minimumPoints: 0,
        maximumPoints: 999,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Plata',
        minimumPoints: 1000,
        maximumPoints: 1999,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Oro',
        minimumPoints: 2000,
        maximumPoints: 9999,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Leagues', null, {});
  }
};
