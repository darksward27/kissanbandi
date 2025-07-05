const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { auth} = require('../middleware/auth'); // ✅ FIXED
const upload = require('../middleware/upload');

router.post('/', auth, upload.single('image'), blogController.createBlog);
router.get('/', blogController.getBlogs);
router.get('/:id', blogController.getBlogById);
router.put('/:id', auth,  upload.single('image'), blogController.updateBlog);
router.delete('/:id', auth, blogController.deleteBlog);
router.patch('/:id/status', auth, blogController.toggleBlogStatus);

module.exports = router;
