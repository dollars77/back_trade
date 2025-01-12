const db = require("../models");
const config = require("../config/auth.config");
const User = db.user;
const Role = db.role;
const Op = db.Sequelize.Op;
var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");
exports.signup = (req, res) => {
  // Save User to Database
  User.create({
    // firstname: req.body.firstname,
    // lastname: req.body.lastname,
    // phone: req.body.phone,
    // birth: req.body.birth,
    // idcard: req.body.idcard,
    // setstatusId:req.body.setstatusId,
    // imageprofile: req.body.imageprofile,
    // imagedriving: req.body.imagedriving,
    username:req.body.username,
    name: req.body.name,
    // password: bcrypt.hashSync(req.body.password, 8)
    password: req.body.password
  })
    .then(user => {
      if (req.body.roles) {
        Role.findAll({
          where: {
            name: {
              [Op.or]: req.body.roles
            }
          }
        }).then(roles => {
          user.setRoles(roles).then(() => {
            res.send({ message: "User was registered successfully!" });
          });
        });
      } else {
        // user role = 1
        user.setRoles([1]).then(() => {
          res.send({ message: "User was registered successfully!" });
        });
      }
    })
    .catch(err => {
      res.status(500).send({ message: err.message });
    });
};
exports.signin = (req, res) => {
  User.findOne({
    where: {
      username: req.body.username
    }
  })
    .then(user => {
      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }
      // var passwordIsValid = bcrypt.compareSync(
      //   req.body.password,
      //   user.password
      // );
      if (req.body.password != user.password) {
        return res.status(401).send({
          accessToken: null,
          message: "Invalid Password!"
        });
      }
      // var token = jwt.sign({ id: user.id }, config.secret, {
      //   expiresIn: 604800 // 24 hours
      // });
      var token = jwt.sign({ 
        id: user.id,
        version: user.version  // เพิ่ม version ใน token
      }, config.secret, {
        expiresIn: "1d"
      });
      var authorities = [];
      user.getRoles().then(roles => {
        for (let i = 0; i < roles.length; i++) {
          authorities.push("ROLE_" + roles[i].name.toUpperCase());
        }
        res.status(200).send({
          id: user.id,
          username:user.username,
          name:user.name,
          roles: authorities,
          accessToken: token
        });
      });
    })
    .catch(err => {
      res.status(500).send({ message: err.message });
    });
};