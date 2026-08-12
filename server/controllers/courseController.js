const Course = require('../models/Course');

const initialCoursesSeed = [];

let isCourseSeeded = false;

const seedCoursesIfNeeded = async () => {
  if (isCourseSeeded) return;
  try {
    const count = await Course.countDocuments();
    if (count === 0) {
      for (const c of initialCoursesSeed) {
        await Course.create(c);
      }
      console.log('🌱 Course collection seeded in MongoDB Atlas');
    }
    isCourseSeeded = true;
  } catch (e) {
    console.error('Course auto-seed notice:', e.message);
  }
};

const getCourses = async (req, res) => {
  try {
    await seedCoursesIfNeeded();
    const courses = await Course.find({});
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch courses from MongoDB Atlas' });
  }
};

const getCourseById = async (req, res) => {
  try {
    await seedCoursesIfNeeded();
    const course = await Course.findById(req.params.id);
    if (course) {
      res.json(course);
    } else {
      res.status(404).json({ message: 'Course not found in MongoDB Atlas' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createCourse = async (req, res) => {
  try {
    await seedCoursesIfNeeded();
    const { title, subtitle, description, category, level, price, thumbnail, lessons } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    const newCourse = await Course.create({
      title,
      subtitle,
      description,
      category: category || 'Development',
      level: level || 'All Levels',
      price: price || 0,
      thumbnail: thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800',
      instructor: req.user ? req.user._id : null,
      instructorName: req.user ? req.user.name : 'Alex Rivera',
      lessons: lessons || [],
    });

    res.status(201).json(newCourse);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error creating course in MongoDB Atlas' });
  }
};

const addLesson = async (req, res) => {
  try {
    const { title, videoUrl, duration, description, isFreePreview } = req.body;

    if (!title || !videoUrl) {
      return res.status(400).json({ message: 'Lesson title and video URL are required' });
    }

    const course = await Course.findById(req.params.id);
    if (course) {
      course.lessons.push({ title, videoUrl, duration, description, isFreePreview });
      await course.save();
      return res.json(course);
    }

    res.status(404).json({ message: 'Course not found in MongoDB Atlas' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getCourses, getCourseById, createCourse, addLesson };
