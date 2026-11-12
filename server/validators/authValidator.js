const { body } = require('express-validator');

const passwordRule = body('password')
  .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
  .matches(/\d/).withMessage('Password must contain at least one number');

const register = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 60 }),
  body('email').trim().isEmail().withMessage('Enter a valid email address').normalizeEmail(),
  passwordRule,
];

const login = [
  body('email').trim().isEmail().withMessage('Enter a valid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const changePassword = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .matches(/\d/).withMessage('New password must contain at least one number'),
];

const updateProfile = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty').isLength({ max: 60 }),
  body('email').optional({ checkFalsy: true }).trim().isEmail().withMessage('Enter a valid email address').normalizeEmail(),
];

module.exports = { register, login, changePassword, updateProfile };
