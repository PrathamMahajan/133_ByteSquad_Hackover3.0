const { dbConnection } = require("../db/mongodb");
const bcrypt = require("bcrypt");
const { saltrounds, jwtKey } = require("../config/config.json");
const jwt = require("jsonwebtoken");

function signup(req, res) {
  try {
    return res.status(200).render("signup");
  } catch (err) {
    console.log("Signup Controller Error : ", err.message);
    return res.status(500).render("errors/something");
  }
}

async function signupValidate(req, res) {
  email = req.body.email;
  const conn = await dbConnection();
  try {
    const result = await conn.find({ email: email }).toArray();
    if (result.length != 0) {
      return res.status(409).send({ error: true, msg: "User Exists" });
    } else {
      let { name, email, password } = req.body;
      bcrypt.genSalt(saltrounds, (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {
          let ans = await conn.insertOne({
            name,
            email,
            password: hash
          });
          if (ans.acknowledged) {
            const payload = {
              email,
            };
            const token = jwt.sign(payload, jwtKey, { expiresIn: "30d" });
            req.session.isLoggedIn = true;
            res.status(200).send({ error: false, token });
          } else {
            res.status(500).send({ error: true, msg: "Something Went Wrong" });
          }
        });
      });
    }
  } catch (err) {
    console.log(err);
  }
}

module.exports = { signup, signupValidate };
