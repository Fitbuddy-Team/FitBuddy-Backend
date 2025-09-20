'use strict';

module.exports = {
  async up (queryInterface) {
    await queryInterface.bulkInsert('MuscleGroups', [
      { name: 'abdominals', createdAt: new Date(), updatedAt: new Date() },
      { name: 'abductors', createdAt: new Date(), updatedAt: new Date() },
      { name: 'adductors', createdAt: new Date(), updatedAt: new Date() },
      { name: 'biceps', createdAt: new Date(), updatedAt: new Date() },
      { name: 'calves', createdAt: new Date(), updatedAt: new Date() },
      { name: 'chest', createdAt: new Date(), updatedAt: new Date() },
      { name: 'forearms', createdAt: new Date(), updatedAt: new Date() },
      { name: 'glutes', createdAt: new Date(), updatedAt: new Date() },
      { name: 'hamstrings', createdAt: new Date(), updatedAt: new Date() },
      { name: 'lats', createdAt: new Date(), updatedAt: new Date() },
      { name: 'lower back', createdAt: new Date(), updatedAt: new Date() },
      { name: 'middle back', createdAt: new Date(), updatedAt: new Date() },
      { name: 'neck', createdAt: new Date(), updatedAt: new Date() },
      { name: 'quadriceps', createdAt: new Date(), updatedAt: new Date() },
      { name: 'shoulders', createdAt: new Date(), updatedAt: new Date() },
      { name: 'traps', createdAt: new Date(), updatedAt: new Date() },
      { name: 'triceps', createdAt: new Date(), updatedAt: new Date() },
    ]);
  },
  async down (queryInterface) {
    await queryInterface.bulkDelete('MuscleGroups', null, {});
  }
};
