'use strict';

module.exports = {
  async up (queryInterface) {
    await queryInterface.bulkInsert('ExerciseCategories', [
      { name: 'cardio', createdAt: new Date(), updatedAt: new Date() },
      { name: 'olympic weightlifting', createdAt: new Date(), updatedAt: new Date() },
      { name: 'plyometrics', createdAt: new Date(), updatedAt: new Date() },
      { name: 'powerlifting', createdAt: new Date(), updatedAt: new Date() },
      { name: 'strength', createdAt: new Date(), updatedAt: new Date() },
      { name: 'stretching', createdAt: new Date(), updatedAt: new Date() },
    ]);
  },
  async down (queryInterface) {
    await queryInterface.bulkDelete('ExerciseCategories', null, {});
  }
};
