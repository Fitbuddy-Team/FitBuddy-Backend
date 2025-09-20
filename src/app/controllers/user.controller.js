import axios from 'axios';
import jwt from "jsonwebtoken";
import { User, Routine, Exercise, ExerciseRoutine, ExerciseCategory } from '../models/index.js';

export const userController = {
  register: async (req, res) => {
    const { email, password, name, weight, height } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Faltan campos obligatorios.' });
    }

    try {
      const auth0Domain = process.env.AUTH0_DOMAIN;
      const clientId = process.env.AUTH0_CLIENT_ID;
      const clientSecret = process.env.AUTH0_CLIENT_SECRET;
      const audience = `https://${auth0Domain}/api/v2/`;

      const tokenResponse = await axios.post(`https://${auth0Domain}/oauth/token`, {
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        audience
      });

      const mgmtToken = tokenResponse.data.access_token;
      const userResponse = await axios.post(
        `https://${auth0Domain}/api/v2/users`,
        {
          email,
          password,
          connection: 'Username-Password-Authentication',
          name
        },
        {
          headers: {
            Authorization: `Bearer ${mgmtToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const auth0User = userResponse.data;
      const newUser = await User.create({
        auth0_id: auth0User.user_id,
        email: auth0User.email,
        name: auth0User.name,
        weight,
        height
      });
      
      res.status(201).json({
        message: 'Usuario registrado exitosamente',
        user: {
          id: newUser.id,
          auth0_id: newUser.auth0_id,
          email: newUser.email,
          name: newUser.name,
          weight: newUser.weight,
          height: newUser.height
        }
      });
    }catch (error) {
      console.error('Error.message:', error.message);
      let msg = 'Error al registrar usuario';
      if (error.response && error.response.data) {
        msg = error.response.data.message || JSON.stringify(error.response.data);
      }
      res.status(500).json({ message: msg });
    }
  },

  login: async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Faltan campos obligatorios.' });
    }

    try {
      const auth0Domain = process.env.AUTH0_DOMAIN;
      const clientId = process.env.AUTH0_CLIENT_ID;
      const clientSecret = process.env.AUTH0_CLIENT_SECRET;
      const audience = process.env.AUTH0_AUDIENCE;

      // Login en Auth0
      const tokenResponse = await axios.post(`https://${auth0Domain}/oauth/token`, {
        grant_type: 'password',
        username: email,
        password: password,
        client_id: clientId,
        client_secret: clientSecret,
        audience,
        scope: 'openid profile email'
      });
      const { access_token, id_token } = tokenResponse.data;

      // Decodificar el id_token para obtener el sub (auth0_id)
      const decoded = jwt.decode(id_token);
      const auth0Id = decoded.sub;

      // Buscar al usuario en BD
      const user = await User.findOne({ where: { auth0_id: auth0Id } });
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado en BD." });
      }

      res.json({
        message: "Login exitoso",
        tokens: {
          access_token,
          id_token,
        },
        user: {
          id: user.id,
          auth0_id: user.auth0_id,
          email: user.email,
          name: user.name,
          weight: user.weight,
          height: user.height
        }
      });
    } catch (error) {
      console.error(error.response?.data || error.message);
      res.status(401).json({ message: 'Email o contraseña incorrectos' });
    }
  },

  getAllUsers: async (req, res) => {
    try {
      // Obtener todos los usuarios, solo campos seleccionados
      const users = await User.findAll({
        attributes: ['id', 'email', 'name', 'weight', 'height']
      });

      res.json({
        message: "Usuarios obtenidos exitosamente",
        users
      });
    } catch (error) {
      console.error('Error getting users:', error.message);
      res.status(500).json({ message: 'Error al obtener usuarios' });
    }
  },

  getUser: async (req, res) => {
    try {
      // Obtener un usuario, solo campos seleccionados
      const user = await User.findOne({
        where: { id: req.params.userId },
        attributes: ['id', 'email', 'name', 'weight', 'height']
      });
      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      res.json({
        message: "Usuario obtenido exitosamente",
        user
      });
    } catch (error) {
      console.error('Error getting user:', error.message);
      res.status(500).json({ message: 'Error al obtener el usuario' });
    }
  },

  updateUser: async (req, res) => {
    const { userId } = req.params;
    const { name, weight, height } = req.body;

    try {
      // Buscar el usuario
      const user = await User.findOne({
        where: { id: Number(userId) },
        attributes: ['id', 'email', 'name', 'weight', 'height']
      });
      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      // Actualizar solo los campos permitidos si vienen en el body
      if (name !== undefined) user.name = name;
      if (weight !== undefined) user.weight = weight;
      if (height !== undefined) user.height = height;

      await user.save();
      res.json({
        message: 'Usuario actualizado exitosamente',
        user
      });
    } catch (error) {
      console.error('Error updating user:', error.message);
      res.status(500).json({ message: 'Error al actualizar el usuario' });
    }
  },

  deleteUser: async (req, res) => {
    const { userId } = req.params;

    try {
      // Buscar el usuario
      const user = await User.findOne({
        where: { id: Number(userId) }
      });
      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      // Eliminar el usuario
      await user.destroy();
      res.json({
        message: 'Usuario eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error deleting user:', error.message);
      res.status(500).json({ message: 'Error al eliminar el usuario' });
    }
  }
};

export default userController;
