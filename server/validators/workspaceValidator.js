const { body } = require('express-validator');

const create = [
  body('name').trim().notEmpty().withMessage('Workspace name is required').isLength({ max: 60 }),
  body('description').optional({ values: 'falsy' }).trim().isLength({ max: 280 }),
];

const update = [
  body('name').optional().trim().notEmpty().withMessage('Workspace name cannot be empty').isLength({ max: 60 }),
  body('description').optional({ values: 'falsy' }).trim().isLength({ max: 280 }),
];

const invite = [
  body('email').trim().isEmail().withMessage('Enter a valid email address').normalizeEmail(),
  body('role').optional().isIn(['admin', 'member']).withMessage('Role must be admin or member'),
];

const updateMember = [
  body('role').isIn(['admin', 'member']).withMessage('Role must be admin or member'),
];

module.exports = { create, update, invite, updateMember };
