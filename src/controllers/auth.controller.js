const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db'); 


const registerUser = async (req, res, next) => {
  const { username, password } = req.body;

  try {
    // Hash the user's password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Dummy DB operation (replace this with your actual DB query)
    await db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    next(err);
  }
};

// Login user function
const loginUser = async (req, res, next) => {
  const { username, password } = req.body;

  try {
    // Dummy DB operation (replace this with your actual DB query)
    const [user] = await db.query('SELECT * FROM users WHERE username = ?', [username]);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Compare the password with the hashed password in the database
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, 'your_jwt_secret', { expiresIn: '1h' });

    res.status(200).json({ token });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registerUser,
  loginUser,
};