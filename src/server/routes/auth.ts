import { Router } from 'express';
import type { Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.ts';
import {
  authenticateUser,
  AuthenticatedRequest,
  generateToken,
  authRateLimiter,
} from '../middleware/auth.ts';

export const authRouter = Router();

// POST /api/auth/register
// Public citizen registration - ALL public registrations strictly receive the 'citizen' role.
authRouter.post('/register', authRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, password, phone, address, city } = req.body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({
        success: false,
        message: 'Full name is required and must be at least 2 characters.',
      });
      return;
    }

    if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
      res.status(400).json({
        success: false,
        message: 'A valid email address is required.',
      });
      return;
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password is required and must be at least 6 characters long.',
      });
      return;
    }

    if (!phone || typeof phone !== 'string' || phone.trim().length < 7) {
      res.status(400).json({
        success: false,
        message: 'A valid phone number is required.',
      });
      return;
    }

    // Check if user already exists
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'An account with this email address already exists. Please sign in instead.',
      });
      return;
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // SECURITY: Public registration is strictly restricted to 'citizen' role.
    // Admin accounts can ONLY be initialized through the secure environment variable seed process.
    const assignedRole = 'citizen';

    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone.trim(),
      address: address && typeof address === 'string' ? address.trim() : '',
      city: city && typeof city === 'string' ? city.trim() : '',
      role: assignedRole,
    });

    const token = generateToken({
      userId: newUser._id.toString(),
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
    });

    res.status(201).json({
      success: true,
      message: 'Citizen account registered successfully!',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        address: newUser.address,
        city: newUser.city,
        createdAt: newUser.createdAt,
      },
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error occurred during account registration.',
    });
  }
});

// POST /api/auth/login
authRouter.post('/login', authRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
      return;
    }

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    });

    res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address,
        city: user.city,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error occurred during authentication.',
    });
  }
});

// GET /api/auth/me
authRouter.get('/me', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address,
        city: user.city,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile.',
    });
  }
});

// PUT /api/auth/profile
authRouter.put('/profile', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, phone, address, city } = req.body;

    const user = await User.findById(req.user?.userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
      return;
    }

    if (name && typeof name === 'string' && name.trim().length >= 2) {
      user.name = name.trim();
    }
    if (phone && typeof phone === 'string' && phone.trim().length >= 7) {
      user.phone = phone.trim();
    }
    if (address !== undefined && typeof address === 'string') {
      user.address = address.trim();
    }
    if (city !== undefined && typeof city === 'string') {
      user.city = city.trim();
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address,
        city: user.city,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update profile.',
    });
  }
});

// PUT /api/auth/change-password
authRouter.put(
  '/change-password',
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Both current password and new password are required.',
        });
        return;
      }

      if (typeof newPassword !== 'string' || newPassword.length < 6) {
        res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters.',
        });
        return;
      }

      const user = await User.findById(req.user?.userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User profile not found.',
        });
        return;
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        res.status(400).json({
          success: false,
          message: 'Current password provided is incorrect.',
        });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Password changed successfully.',
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to update password.',
      });
    }
  }
);
