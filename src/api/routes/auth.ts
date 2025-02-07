import express from 'express';
import { body } from 'express-validator';
import jwt from 'jsonwebtoken';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { validate } from '../middleware/validate.middleware';
import { authLimiter } from '../middleware/rateLimiter.middleware';
import { ApiError } from '../middleware/error.middleware';

const router = express.Router();
const authService = new AuthService();
const userService = new UserService();

// Login validation rules
const loginValidation = [
  body('email').isEmail().withMessage('Must be a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

// Signup validation rules
const signupValidation = [
  body('email').isEmail().withMessage('Must be a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
];

// Login endpoint with rate limiting and validation
router.post(
  '/login',
  authLimiter,
  validate(loginValidation),
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await authService.validateUser(email, password);
      
      if (!user) {
        throw new ApiError(401, 'Invalid credentials');
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Signup endpoint with validation
router.post(
  '/signup',
  validate(signupValidation),
  async (req, res, next) => {
    try {
      const { email, password, name } = req.body;
      
      const existingUser = await userService.findByEmail(email);
      if (existingUser) {
        throw new ApiError(409, 'Email already registered');
      }

      const hashedPassword = await authService.hashPassword(password);
      const user = await userService.createUser({ 
        email, 
        password: hashedPassword, 
        name 
      });
      
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
