'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // 1) Insertar usuarios directamente
    const usersData = [
      { name: 'Alice Johnson', email: 'alice@example.com', auth0_id: 'auth0|alice123', weight: 62.5, height: 1.65, createdAt: now, updatedAt: now },
      { name: 'Bob Smith',       email: 'bob@example.com',   auth0_id: 'auth0|bob123',   weight: 78.3, height: 1.80, createdAt: now, updatedAt: now },
      { name: 'Carlos Pérez',    email: 'carlos@example.com',auth0_id: 'auth0|carlos123',weight: 70.0, height: 1.72, createdAt: now, updatedAt: now },
      { name: 'Daniela Gómez',   email: 'daniela@example.com',auth0_id: 'auth0|daniela123',weight: 58.0, height: 1.60, createdAt: now, updatedAt: now }
    ];

    await queryInterface.bulkInsert('Users', usersData, {});

    // 2) Obtener la liga con menor minimumPoints (si existe)
    const leagues = await queryInterface.sequelize.query(
      `SELECT id FROM "Leagues" ORDER BY "minimumPoints" ASC LIMIT 1;`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (!leagues || leagues.length === 0) {
      // no hay liga, no crear LeagueMembers
      return;
    }
    const leagueId = leagues[0].id;

    // 3) Obtener los usuarios recién insertados por email
    const users = await queryInterface.sequelize.query(
      `SELECT id, email FROM "Users" WHERE email IN ('alice@example.com','bob@example.com','carlos@example.com','daniela@example.com');`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (users.length === 0) return;

    // 4) Insertar LeagueMembers con points = 0
    const members = users.map(u => ({
      userId: u.id,
      leagueId,
      points: 0,
      createdAt: now,
      updatedAt: now
    }));

    await queryInterface.bulkInsert('LeagueMembers', members, {});
  },

  async down(queryInterface, Sequelize) {
    // Borrar LeagueMembers creados y luego los Users creados por email
    await queryInterface.bulkDelete('LeagueMembers', null, {
      where: {},
    });

    await queryInterface.bulkDelete('Users', {
      email: [
        'alice@example.com',
        'bob@example.com',
        'carlos@example.com',
        'daniela@example.com'
      ]
    }, {});
  }
};