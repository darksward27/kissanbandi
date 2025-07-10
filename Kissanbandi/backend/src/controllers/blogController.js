const Blog = require('../models/Blog');

// Create a new blog post
exports.createBlog = async (req, res) => {
  try {
    const { title, content, author, tags } = req.body;
    const imagePath = req.file ? req.file.path : null;

    const blog = new Blog({
      title,
      content,
      author,
      tags: tags ? tags.split(',') : [],
      image: imagePath,
    });

    const saved = await blog.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all blog posts
exports.getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single blog post by ID
exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    res.json(blog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a blog
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    res.json({ message: 'Blog deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update blog post
exports.updateBlog = async (req, res) => {
  try {
    const { title, content, author, tags } = req.body;
    const imagePath = req.file ? req.file.path : null;

    const updatedFields = {
      title,
      content,
      author,
      tags: tags ? tags.split(',') : [],
    };

    if (imagePath) {
      updatedFields.image = imagePath;
    }

    const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, updatedFields, {
      new: true,
    });

    if (!updatedBlog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    res.json(updatedBlog);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Toggle blog status (publish <-> draft)
exports.toggleBlogStatus = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    // Toggle status
    blog.status = blog.status === 'publish' ? 'draft' : 'publish';

    await blog.save();

    res.json({ message: `Blog status updated to ${blog.status}`, blog });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
