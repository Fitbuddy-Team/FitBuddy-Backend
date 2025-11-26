'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('AvatarItems', [
      // 🧠 Hair
      {
        type: 'hair',
        borderSpritePath: '/hairs/hair_1_lines.png',
        areaSpritePath: '/hairs/hair_1_color.png',
        price: 6,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'hair',
        borderSpritePath: '/hairs/hair_2_lines.png',
        areaSpritePath: '/hairs/hair_2_color.png',
        price: 12,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'hair',
        borderSpritePath: '/hairs/hair_3_lines.png',
        areaSpritePath: '/hairs/hair_3_color.png',
        price: 10,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'hair',
        borderSpritePath: '/hairs/hair_4_lines.png',
        areaSpritePath: '/hairs/hair_4_color.png',
        price: 15,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'hair',
        borderSpritePath: '/hairs/hair_5_lines.png',
        areaSpritePath: '/hairs/hair_5_color.png',
        price: 20,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
        {
        type: 'hair',
        borderSpritePath: '/hairs/hair_6_lines.png',
        areaSpritePath: '/hairs/hair_6_color.png',
        price: 18,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
        {
        type: 'hair',
        borderSpritePath: '/hairs/hair_7_lines.png',
        areaSpritePath: '/hairs/hair_7_color.png',
        price: 22,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
        {
        type: 'hair',
        borderSpritePath: '/hairs/hair_8_lines.png',
        areaSpritePath: '/hairs/hair_8_color.png',
        price: 25,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // 👕 Tops
      {
        type: 'top',
        borderSpritePath: '/tops/top_1_lines.png',
        areaSpritePath: '/tops/top_1_color.png',
        price: 6,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'top',
        borderSpritePath: '/tops/top_2_lines.png',
        areaSpritePath: '/tops/top_2_color.png',
        price: 12,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'top',
        borderSpritePath: '/tops/top_3_lines.png',
        areaSpritePath: '/tops/top_3_color.png',
        price: 10,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'top',
        borderSpritePath: '/tops/top_4_lines.png',
        areaSpritePath: '/tops/top_4_color.png',
        price: 15,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'top',
        borderSpritePath: '/tops/top_5_lines.png',
        areaSpritePath: '/tops/top_5_color.png',
        price: 20,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      

      // 👖 Bottoms
      {
        type: 'bottom',
        borderSpritePath: '/base/underwear_colors/big_boy.png',
        areaSpritePath: null, 
        price: 0,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'bottom',
        borderSpritePath: '/base/underwear_colors/big_girl.png',
        areaSpritePath: null, 
        price: 0,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'bottom',
        borderSpritePath: '/base/underwear_colors/skinny_girl.png',
        areaSpritePath: null, 
        price: 0,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'bottom',
        borderSpritePath: '/base/underwear_colors/skinny_boy.png',
        areaSpritePath: null, 
        price: 0,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // 🥇 Medals
      {
        type: 'medal',
        borderSpritePath: '/medals/medal_1.png',
        areaSpritePath: null, 
        price: 70,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'medal',
        borderSpritePath: '/medals/medal_2.png',
        areaSpritePath: null, 
        price: 150,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'medal',
        borderSpritePath: '/medals/medal_3.png',
        areaSpritePath: null, 
        price: 300,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('AvatarItems', null, {});
  }
};
