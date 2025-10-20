'use strict';

module.exports = {
  async up (queryInterface) {
    const { QueryTypes } = queryInterface.sequelize;

    // Tomar dos usuarios existentes (ajustar el ORDER/LIMIT)
    const users = await queryInterface.sequelize.query(
      'SELECT id FROM "Users" ORDER BY id LIMIT 2;',
      { type: QueryTypes.SELECT }
    );
    if (!users || users.length === 0) return;

    const userIds = users.map(u => u.id);
    // Fecha de unión anterior a las seeds de sesiones (para que esas sesiones cuenten)
    const joinDate = new Date('2024-01-01T00:00:00Z');

    // Crear grupo
    const groupName = 'Seeded Group';
    const groupCode = 'SEED01';
    const maxMembers = 10;
    const now = new Date();

    const insertGroupRes = await queryInterface.sequelize.query(
      `INSERT INTO "Groups" ("name","description","code","maxMembers","createdAt","updatedAt")
       VALUES (:name, :description, :code, :maxMembers, :now, :now)
       RETURNING id;`,
      {
        replacements: { name: groupName, description: 'Grupo creado por seeder', code: groupCode, maxMembers, now },
        type: QueryTypes.INSERT
      }
    );
    // Postgres devuelve filas en insert; obtener id
    const groupId = (insertGroupRes && insertGroupRes[0] && insertGroupRes[0][0] && insertGroupRes[0][0].id)
      || (insertGroupRes && insertGroupRes[0] && insertGroupRes[0].id)
      || null;

    // Si no conseguimos id, intentar buscar por code
    if (!groupId) {
      const rows = await queryInterface.sequelize.query(
        'SELECT id FROM "Groups" WHERE code = :code LIMIT 1;',
        { replacements: { code: groupCode }, type: QueryTypes.SELECT }
      );
      if (rows && rows[0]) groupId = rows[0].id;
    }

    if (!groupId) return;

    // Insertar GroupMembers con createdAt = joinDate (para que sessions posteriores cuenten)
    const gmRows = userIds.map(uid => ({
      userId: uid,
      groupId: groupId,
      points: 0,
      createdAt: joinDate,
      updatedAt: now
    }));
    await queryInterface.bulkInsert('GroupMembers', gmRows);

    // Actualizar puntos en GroupMembers sumando únicamente las Sessions ocurridas desde su createdAt (fecha de unión)
    await queryInterface.sequelize.query(`
      UPDATE "GroupMembers" gm
      SET points = COALESCE(sub.total, 0)
      FROM (
        SELECT gm2."userId", SUM(s.points)::integer AS total
        FROM "GroupMembers" gm2
        JOIN "Sessions" s
          ON s."userId" = gm2."userId"
          AND s."date" >= gm2."createdAt"
        WHERE gm2."groupId" = :groupId
        GROUP BY gm2."userId"
      ) sub
      WHERE gm."groupId" = :groupId AND gm."userId" = sub."userId";
    `, { replacements: { groupId }, type: QueryTypes.RAW });
  },

  async down (queryInterface) {
    const { QueryTypes } = queryInterface.sequelize;
    // Borrar el group creado por code y sus GroupMembers
    await queryInterface.sequelize.query(
      `DELETE FROM "GroupMembers" gm
       USING "Groups" g
       WHERE gm."groupId" = g.id AND g.code = :code;`,
      { replacements: { code: 'SEED01' }, type: QueryTypes.RAW }
    );
    await queryInterface.sequelize.query(
      `DELETE FROM "Groups" WHERE code = :code;`,
      { replacements: { code: 'SEED01' }, type: QueryTypes.RAW }
    );
  }
};