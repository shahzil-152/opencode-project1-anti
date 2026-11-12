const { body } = require('express-validator');

const STATUSES = ['backlog', 'todo', 'in_progress', 'review', 'completed'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const create = [
  body('workspace').isMongoId().withMessage('A valid workspace is required'),
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 140 }),
  body('description').optional({ values: 'falsy' }).trim().isLength({ max: 5000 }),
  body('status').optional().isIn(STATUSES).withMessage('Invalid status'),
  body('priority').optional().isIn(PRIORITIES).withMessage('Invalid priority'),
  body('dueDate').optional({ values: 'null' }).isISO8601().withMessage('Due date must be a valid date'),
  body('project').optional({ values: 'null' }).isMongoId().withMessage('Invalid project'),
  body('assignee').optional({ values: 'null' }).isMongoId().withMessage('Invalid assignee'),
  body('labels').optional().isArray({ max: 10 }).withMessage('At most 10 labels'),
];

const update = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty').isLength({ max: 140 }),
  body('description').optional({ values: 'null' }).trim().isLength({ max: 5000 }),
  body('status').optional().isIn(STATUSES).withMessage('Invalid status'),
  body('priority').optional().isIn(PRIORITIES).withMessage('Invalid priority'),
  body('dueDate').optional({ values: 'null' }).isISO8601().withMessage('Due date must be a valid date'),
  body('project').optional({ values: 'null' }).isMongoId().withMessage('Invalid project'),
  body('assignee').optional({ values: 'null' }).isMongoId().withMessage('Invalid assignee'),
  body('labels').optional().isArray({ max: 10 }),
];

const reorder = [
  body('updates').isArray({ min: 1, max: 200 }).withMessage('updates must be a non-empty list'),
  body('updates.*.id').isMongoId().withMessage('Invalid task id'),
  body('updates.*.status').isIn(STATUSES).withMessage('Invalid status'),
  body('updates.*.position').isFloat({ min: 0 }).withMessage('Position must be a number'),
  body('updates.*.previousStatus').optional().isIn(STATUSES),
];

const comment = [
  body('body').trim().notEmpty().withMessage('Comment cannot be empty').isLength({ max: 2000 }),
];

const subtask = [
  body('title').trim().notEmpty().withMessage('Subtask title is required').isLength({ max: 140 }),
];

const subtaskUpdate = [
  body('title').optional().trim().notEmpty().isLength({ max: 140 }),
  body('completed').optional().isBoolean(),
];

module.exports = { create, update, reorder, comment, subtask, subtaskUpdate };
