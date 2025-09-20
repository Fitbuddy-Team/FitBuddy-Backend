'use strict';
const bcrypt = require('bcrypt');
module.exports = {
  async up (queryInterface) {
    // 🔐 Hasheamos contraseñas
    const hashPassword = (plain) => bcrypt.hashSync(plain, 10);

    await queryInterface.bulkInsert('Users', [
      {
        name: 'Alice Johnson',
        email: 'alice@example.com',
        password: hashPassword('alice123'),
        weight: 62.5,
        height: 1.65,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Bob Smith',
        email: 'bob@example.com',
        password: hashPassword('bob123'),
        weight: 78.3,
        height: 1.80,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Carlos Pérez',
        email: 'carlos@example.com',
        password: hashPassword('carlos123'),
        weight: 70.0,
        height: 1.72,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Daniela Gómez',
        email: 'daniela@example.com',
        password: hashPassword('daniela123'),
        weight: 58.0,
        height: 1.60,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down (queryInterface) {
    await queryInterface.bulkDelete('Users', null, {});
  }
};
