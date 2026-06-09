const User = require('../models/User');
const { sendWelcomeEmail } = require('../services/emailService');

exports.register = async (req, res) => {
  try {
    const { uid: firebaseUID, email, name, picture } = req.firebaseUser;
    const { username, bio } = req.body;

    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    const sanitizedUsername = username.toLowerCase().replace(/[^a-zA-Z0-9_.]/g, '');

    const userExists = await User.findOne({
      $or: [{ firebaseUID }, { email }, { username: sanitizedUsername }],
    });

    if (userExists) {
      return res.status(400).json({ message: 'User or username already exists' });
    }

    const user = await User.create({
      firebaseUID,
      username: sanitizedUsername,
      name: name || sanitizedUsername,
      email,
      bio: bio || '',
      profileImage: picture || undefined,
    });

    // Send welcome email (non-blocking — doesn't await)
    sendWelcomeEmail(user).catch((err) =>
      console.error('[Email] Welcome email failed:', err.message)
    );

    return res.status(201).json({
      message: 'User registered successfully',
      user,
    });
  } catch (error) {
    console.error('Registration Controller Error:', error);
    return res.status(500).json({ message: 'Server error during registration' });
  }
};

exports.login = async (req, res) => {
  try {
    const { uid: firebaseUID, email, name, picture } = req.firebaseUser;

    let user = await User.findOne({ firebaseUID });

    if (!user) {
      // Auto-create MongoDB user profile if Firebase user exists but MongoDB doesn't
      console.log(`[Auth] Auto-creating MongoDB user for Firebase UID: ${firebaseUID}`);

      const baseUsername = (email || 'user').split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
      let username = baseUsername;
      let isUnique = false;
      let counter = 1;

      while (!isUnique) {
        const existingUsername = await User.findOne({ username: username.toLowerCase() });
        if (!existingUsername) {
          isUnique = true;
        } else {
          username = `${baseUsername}${counter}`;
          counter++;
        }
      }

      user = await User.create({
        firebaseUID,
        username: username.toLowerCase(),
        name: name || username,
        email,
        profileImage: picture || undefined,
      });
    }

    user.isOnline = true;
    user.lastActive = new Date();
    await user.save();

    return res.status(200).json({
      message: 'Logged in successfully',
      user,
    });
  } catch (error) {
    console.error('Login Controller Error:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { uid: firebaseUID, email, name, picture } = req.firebaseUser;

    let user = await User.findOne({ firebaseUID });

    if (!user) {
      const emailTaken = await User.findOne({ email });
      if (emailTaken) {
        return res.status(400).json({ message: 'Email already registered with another account' });
      }

      const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
      let username = baseUsername;
      let isUnique = false;
      let counter = 1;

      while (!isUnique) {
        const existingUsername = await User.findOne({ username: username.toLowerCase() });
        if (!existingUsername) {
          isUnique = true;
        } else {
          username = `${baseUsername}${counter}`;
          counter++;
        }
      }

      user = await User.create({
        firebaseUID,
        username: username.toLowerCase(),
        name: name || username,
        email,
        profileImage: picture || undefined,
      });
    } else {
      user.isOnline = true;
      user.lastActive = new Date();
      await user.save();
    }

    return res.status(200).json({
      message: 'Google login successful',
      user,
    });
  } catch (error) {
    console.error('Google Auth Controller Error:', error);
    return res.status(500).json({ message: 'Server error during Google login' });
  }
};

exports.getMe = async (req, res) => {
  try {
    // req.user is already the full MongoDB document set by protect middleware
    if (!req.user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json(req.user);
  } catch (error) {
    console.error('getMe error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
