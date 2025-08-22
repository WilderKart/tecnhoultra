const db = require("../models");
const User = db.usuarios;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.signup = async (req, res) => {
  try {
    await User.create({
      nombre: req.body.nombre,
      correo: req.body.correo,
      contrasena: bcrypt.hashSync(req.body.contrasena, 8),
      rol: req.body.rol || 'user'
    });
    res.send({ message: "¡Usuario registrado exitosamente!" });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.signin = async (req, res) => {
  try {
    const user = await User.findOne({
      where: {
        correo: req.body.correo
      }
    });

    if (!user) {
      return res.status(404).send({ message: "Usuario no encontrado." });
    }

    const passwordIsValid = bcrypt.compareSync(
      req.body.contrasena,
      user.contrasena
    );

    if (!passwordIsValid) {
      return res.status(401).send({
        accessToken: null,
        message: "¡Contraseña inválida!"
      });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: 86400 // 24 hours
    });

    res.status(200).send({
      id: user.id,
      nombre: user.nombre,
      correo: user.correo,
      rol: user.rol,
      accessToken: token
    });

  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};