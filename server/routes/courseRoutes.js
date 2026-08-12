const express = require('express');
const router = express.Router();
const { getCourses, getCourseById, createCourse, addLesson } = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', getCourses);
router.get('/:id', getCourseById);
router.post('/', protect, authorize('instructor', 'admin'), createCourse);
router.post('/:id/lessons', protect, authorize('instructor', 'admin'), addLesson);

module.exports = router;
