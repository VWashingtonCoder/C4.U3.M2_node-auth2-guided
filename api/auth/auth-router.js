const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');

const router = require('express').Router()
const User = require('../users/users-model.js')
const { restricted } = require('./auth-middleware');

const { BCRYPT_ROUNDS, JWT_SECRET } = require('../../config')

router.post('/register', (req, res, next) => {
  let user = req.body

  // bcrypting the password before saving
  const hash = bcrypt.hashSync(user.password, BCRYPT_ROUNDS)
  // never save the plain text password in the db
  user.password = hash

  User.add(user)
    .then(saved => {
      res.status(201).json({ message: `Great to have you, ${saved.username}` })
    })
    .catch(next) // our custom err handling middleware in server.js will trap this
})

router.post('/login', (req, res, next) => {
  let { username, password } = req.body

  User.findBy({ username })
    .then(([user]) => {
      if (user && bcrypt.compareSync(password, user.password)) {
        res.status(200).json({
          message: `Welcome back ${user.username}...`,
          token: generateToken(user)
        })
      } else {
        next({ status: 401, message: 'Invalid Credentials' })
      }
    })
    .catch(next)
})

router.get('/logout', restricted, async (req, res, next) => {
  await User.updateLogoutTime(req.decodedJwt.subject);
  res.json({ message: 'You are now logged out.' });
});

function generateToken(user) {
  const payload = {
    subject: user.id,
    username: user.username,
    role: user.role,
    asdf: 'qwer',
  };
  const options = { expiresIn: '1d' };
  return jwt.sign(payload, JWT_SECRET, options);
}


router.get('/show-headers', (req, res) => {
  console.log(req.headers);
  res.end();
})

module.exports = router
