import { Muscomonedas, User } from '../models/index.js';

export const muscomonedasController = {
  getUserMuscomonedas: async (req, res) => {
    try {
      const { userId } = req.params;

      // Validar que userId sea un número
      if (!userId || isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario inválido'
        });
      }

      // Verificar que el usuario existe
      const user = await User.findByPk(parseInt(userId));
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Buscar o crear el registro de Muscomonedas para el usuario
      let muscomonedas = await Muscomonedas.findOne({
        where: { userId: parseInt(userId) }
      });

      // Si no existe, crear uno con cantidad 0
      if (!muscomonedas) {
        muscomonedas = await Muscomonedas.create({
          userId: parseInt(userId),
          amount: 0
        });
      }

      res.status(200).json({
        success: true,
        message: 'Muscomonedas obtenidas exitosamente',
        data: {
          userId: muscomonedas.userId,
          amount: muscomonedas.amount
        }
      });

    } catch (error) {
      console.error('Error al obtener muscomonedas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
};

export default muscomonedasController;

