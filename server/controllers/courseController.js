const Course = require('../models/Course');

const initialCoursesSeed = [
  {
    title: 'Full-Stack MERN Web Development Masterclass',
    subtitle: 'Build production-ready web applications with MongoDB, Express, React & Node.js',
    description: 'Learn modern full-stack web development from scratch. Build real-world applications with state-of-the-art architectures, JWT authentication, video streaming, REST APIs, and modern React state management.',
    category: 'Development',
    level: 'All Levels',
    price: 49.99,
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=800',
    instructorName: 'Sarah Jenkins',
    ratings: { average: 4.9, count: 320 },
    lessons: [
      {
        title: '01. Introduction to Modern MERN Stack Architecture',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        duration: '09:56',
        description: 'Overview of standard monolithic MERN app vs microservice architecture.',
        isFreePreview: true,
      },
      {
        title: '02. Setting up Express Server & MongoDB Connection',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        duration: '14:20',
        description: 'Configuring Mongoose schemas, controllers, and environment configuration.',
        isFreePreview: true,
      },
      {
        title: '03. Building React Frontend with Vite & Dynamic CSS',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        duration: '18:45',
        description: 'Creating glassmorphism components, context providers, and responsive layouts.',
        isFreePreview: false,
      },
    ],
  },
  {
    title: 'Advanced React 18, Hooks & State Management',
    subtitle: 'Master React custom hooks, Context API, performance tuning, and component patterns',
    description: 'Deep dive into advanced React concepts. Learn memoization, custom hooks, async state management, and modern component design patterns.',
    category: 'Development',
    level: 'Intermediate',
    price: 39.99,
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800',
    instructorName: 'Alex Rivera',
    ratings: { average: 4.8, count: 210 },
    lessons: [
      {
        title: '01. React 18 Concurrent Rendering & Suspense',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        duration: '12:15',
        description: 'Understanding transition hooks and dynamic suspense fallbacks.',
        isFreePreview: true,
      },
      {
        title: '02. Custom Hook Design Patterns',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        duration: '16:40',
        description: 'Refactoring state logic into reusable, clean custom hooks.',
        isFreePreview: false,
      },
    ],
  },
  {
    title: 'UI/UX Design Systems & Micro-Animations',
    subtitle: 'Design stunning user interfaces with dark mode, Glassmorphic effects, and fluid CSS',
    description: 'Elevate your UI design skills. Learn layout math, vibrant palette curation, dynamic hover micro-animations, and responsive typography.',
    category: 'Design',
    level: 'Beginner',
    price: 29.99,
    thumbnail: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=800',
    instructorName: 'Elena Rostova',
    ratings: { average: 4.95, count: 185 },
    lessons: [
      {
        title: '01. Fundamentals of Glassmorphism & Backdrop Filters',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoylikes.mp4',
        duration: '11:05',
        description: 'Styling cards with blur filters, subtle borders, and glowing accents.',
        isFreePreview: true,
      },
    ],
  },
];

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
