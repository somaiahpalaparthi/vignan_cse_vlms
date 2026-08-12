import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { fetchAPI } from '../services/api';
import { VideoPlayer } from '../components/VideoPlayer';
import { PlayCircle, CheckCircle2, FileText, ChevronLeft, ArrowRight, Lock } from 'lucide-react';

export const WatchLesson = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [course, setCourse] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [completedLessons, setCompletedLessons] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourse = async () => {
      try {
        const data = await fetchAPI(`/courses/${id}`);
        setCourse(data);
        if (data && data.lessons && data.lessons.length > 0) {
          const lessonParam = searchParams.get('lesson');
          const matched = data.lessons.find((l, idx) => (l._id === lessonParam || idx.toString() === lessonParam));
          setCurrentLesson(matched || data.lessons[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadCourse();
  }, [id, searchParams]);

  const handleLessonEnded = () => {
    if (currentLesson) {
      setCompletedLessons((prev) => ({ ...prev, [currentLesson._id || currentLesson.title]: true }));
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>Loading lesson classroom...</div>;
  }

  if (!course || !currentLesson) {
    return <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>Lesson not available.</div>;
  }

  return (
    <div>
      {/* Back to course button */}
      <div style={{ marginBottom: '16px' }}>
        <Link to={`/course/${course._id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
          <ChevronLeft size={18} /> Back to Course Overview
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '28px' }}>
        
        {/* Main Video & Notes */}
        <div>
          <VideoPlayer
            videoUrl={currentLesson.videoUrl}
            title={currentLesson.title}
            onEnded={handleLessonEnded}
          />

          <div className="glass-panel" style={{ padding: '24px', marginTop: '24px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
              {currentLesson.title}
            </h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.95rem' }}>
              {currentLesson.description || 'In this lecture, we explore key concepts and practical implementations step by step.'}
            </p>
          </div>
        </div>

        {/* Sidebar Playlist */}
        <div>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Course Content</span>
              <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                {Object.keys(completedLessons).length} / {course.lessons.length} Done
              </span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {course.lessons.map((lesson, idx) => {
                const isActive = (currentLesson._id && currentLesson._id === lesson._id) || currentLesson.title === lesson.title;
                const isDone = completedLessons[lesson._id || lesson.title];

                return (
                  <button
                    key={lesson._id || idx}
                    onClick={() => setCurrentLesson(lesson)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 14px',
                      background: isActive ? 'var(--primary-light)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isActive ? 'var(--primary)' : 'var(--glass-border)'}`,
                      borderRadius: 'var(--radius-sm)',
                      color: isActive ? '#fff' : 'var(--text-muted)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'var(--transition)',
                    }}
                  >
                    {isDone ? (
                      <CheckCircle2 size={18} color="var(--success)" />
                    ) : (
                      <PlayCircle size={18} color={isActive ? 'var(--accent)' : 'var(--text-dim)'} />
                    )}

                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: isActive ? 700 : 500 }}>{lesson.title}</div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{lesson.duration || '10:00'} min</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
