import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchAPI } from '../services/api';
import { PlayCircle, Lock, Star, Clock, Award, Users, CheckCircle, Video } from 'lucide-react';

export const CourseDetails = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourse = async () => {
      try {
        const data = await fetchAPI(`/courses/${id}`);
        setCourse(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadCourse();
  }, [id]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>Loading course overview...</div>;
  }

  if (!course) {
    return <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>Course not found.</div>;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px' }}>
      
      {/* Main Content Area */}
      <div>
        <div style={{ marginBottom: '24px' }}>
          <span className="badge badge-accent" style={{ marginBottom: '12px' }}>{course.category}</span>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '12px', color: '#fff' }}>{course.title}</h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.6 }}>{course.description}</p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={16} color="var(--accent)" />
              <span>Created by <strong style={{ color: '#fff' }}>{course.instructorName}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--warning)' }}>
              <Star size={16} fill="var(--warning)" />
              <span>{course.ratings ? course.ratings.average : 4.8} ({course.ratings ? course.ratings.count : 150} reviews)</span>
            </div>
          </div>
        </div>

        {/* Syllabus / Lesson List */}
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Video size={20} color="var(--primary)" /> Course Syllabus ({course.lessons ? course.lessons.length : 0} Lectures)
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {course.lessons && course.lessons.length > 0 ? (
              course.lessons.map((lesson, idx) => (
                <div 
                  key={lesson._id || idx} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '14px 18px', 
                    background: 'rgba(255,255,255,0.03)', 
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--glass-border)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    {lesson.isFreePreview ? (
                      <PlayCircle size={20} color="var(--accent)" />
                    ) : (
                      <Lock size={18} color="var(--text-dim)" />
                    )}
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#fff' }}>{lesson.title}</div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{lesson.duration || '10:00'} min</span>
                    </div>
                  </div>

                  {lesson.isFreePreview && (
                    <Link to={`/watch/${course._id}?lesson=${lesson._id || idx}`} className="btn btn-secondary btn-sm">
                      Free Preview
                    </Link>
                  )}
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No lessons added yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar Checkout / Start Card */}
      <div>
        <div className="glass-panel" style={{ padding: '24px', sticky: 'top', top: '100px' }}>
          <img src={course.thumbnail} alt={course.title} style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', marginBottom: '20px' }} />
          
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginBottom: '16px' }}>
            {course.price === 0 ? 'FREE' : `$${course.price}`}
          </div>

          <Link to={`/watch/${course._id}`} className="btn btn-primary btn-lg" style={{ width: '100%', marginBottom: '16px' }}>
            Start Learning Now
          </Link>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={16} color="var(--success)" /> Full lifetime access
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={16} color="var(--success)" /> Access on mobile and desktop
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={16} color="var(--accent)" /> Certificate of completion
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
