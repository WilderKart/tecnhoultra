const db = require("../models");
const bcrypt = require("bcryptjs");
const User = db.usuarios;

// Crear un nuevo usuario (desde el panel de admin)
exports.create = async (req, res) => {
  try {
    const { nombre, correo, contrasena, rol } = req.body;

    // Validar que los campos necesarios estén presentes
    if (!nombre || !correo || !contrasena) {
      return res.status(400).send({ message: "El nombre, correo y contraseña son obligatorios." });
    }

    const newUser = await User.create({
      nombre,
      correo,
      contrasena: bcrypt.hashSync(contrasena, 8),
      rol: rol || 'user', // Rol por defecto 'user' si no se especifica
    });

    // No devolver la contraseña en la respuesta
    const userResponse = newUser.toJSON();
    delete userResponse.contrasena;

    res.status(201).send(userResponse);
  } catch (error) {
    // Manejar error de correo duplicado
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).send({ message: "El correo ya está en uso." });
    }
    res.status(500).send({ message: error.message || "Ocurrió un error al crear el usuario." });
  }
};

// Obtener todos los usuarios
exports.findAll = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['contrasena'] } // Excluir la contraseña de la respuesta
    });
    res.send(users);
  } catch (error) {
    res.status(500).send({ message: error.message || "Ocurrió un error al obtener los usuarios." });
  }
};

// Actualizar un usuario por ID
exports.update = async (req, res) => {
  const id = req.params.id;
  try {
    const userData = req.body;

    // Si se está actualizando la contraseña, hashearla
    if (userData.contrasena) {
      userData.contrasena = bcrypt.hashSync(userData.contrasena, 8);
    }

    const [num] = await User.update(userData, {
      where: { id: id }
    });

    if (num === 1) {
      res.send({ message: "Usuario actualizado correctamente." });
    } else {
      res.status(404).send({ message: `No se pudo actualizar el usuario con id=${id}. Quizás no fue encontrado.` });
    }
  } catch (error) {
    res.status(500).send({ message: `Error al actualizar el usuario con id=${id}` });
  }
};

// Eliminar un usuario por ID
exports.delete = async (req, res) => {
  const id = req.params.id;
  try {
    const num = await User.destroy({
      where: { id: id }
    });

    if (num === 1) {
      res.send({ message: "Usuario eliminado correctamente." });
    } else {
      res.status(404).send({ message: `No se pudo eliminar el usuario con id=${id}. Quizás no fue encontrado.` });
    }
  } catch (error) {
    res.status(500).send({ message: `Error al eliminar el usuario con id=${id}` });
  }
};