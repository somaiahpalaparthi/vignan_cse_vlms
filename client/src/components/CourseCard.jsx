import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Star, Video, Users, ArrowRight } from 'lucide-react';

export const CourseCard = ({ course }) => {
  return (
    <div className="glass-panel glass-panel-hover" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      
      {/* Course Thumbnail */}
      <div style={{ position: 'relative', width: '100%', height: '180px', overflow: 'hidden' }}>
        <img 
          src={course.thumbnail} 
          alt={course.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }} 
        />
        <div style={{ position: 'absolute', top: 12, right: 12 }}>
          <span className="badge badge-accent">{course.category || 'Development'}</span>
        </div>
        <div style={{ position: 'absolute', bottom: 12, left: 12 }}>
          <span className="badge badge-primary">{course.level}</span>
        </div>
      </div>

      {/* Course Content */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px', color: '#fff', lineHeight: 1.3 }}>
            {course.title}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {course.subtitle || course.description}
          </p>
        </div>

        <div>
          {/* Metadata Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-dim)', borderTop: '1px solid var(--glass-border)', paddingTop: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Video size={14} color="var(--accent)" />
              <span>{course.lessons ? course.lessons.length : 0} Lessons</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--warning)', fontWeight: 600 }}>
              <Star size={14} fill="var(--warning)" />
              <span>{course.ratings ? course.ratings.average : 4.8}</span>
            </div>
            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
              {course.price === 0 ? 'FREE' : `$${course.price}`}
            </div>
          </div>

          <Link to={`/course/${course._id}`} className="btn btn-primary" style={{ width: '100%' }}>
            <span>Explore Course</span>
            <ArrowRight size={16} />
          </Link>
        </div>

      </div>

    </div>
  );
};
