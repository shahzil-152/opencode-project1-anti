const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { avatarUpload } = require('../middleware/upload');
const authValidator = require('../validators/authValidator');
const userController = require('../controllers/userController');

const router = express.Router();

router.use(requireAuth);

router.patch(
  '/me',
  validate(authValidator.updateProfile),
  userController.updateProfile
);
router.patch('/me/password', validate(authValidator.changePassword), userController.changePassword);
router.patch('/me/preferences', userController.updatePreferences);
router.post('/me/avatar', avatarUpload.single('image'), userController.uploadAvatar);
router.delete('/me', userController.deleteAccount);

module.exports = router;
