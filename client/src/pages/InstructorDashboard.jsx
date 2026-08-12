import React, { useState } from 'react';
import { fetchAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Video, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export const InstructorDashboard = () => {
  const { user } = useAuth();
  
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Development');
  const [level, setLevel] = useState('All Levels');
  const [price, setPrice] = useState(49.99);
  const [thumbnail, setThumbnail] = useState('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800');
  
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonVideoUrl, setLessonVideoUrl] = useState('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
  const [lessons, setLessons] = useState([]);

  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleAddLesson = (e) => {
    e.preventDefault();
    if (!lessonTitle || !lessonVideoUrl) return;
    setLessons([
      ...lessons,
      {
        title: lessonTitle,
        videoUrl: lessonVideoUrl,
        duration: '12:00',
        isFreePreview: lessons.length === 0,
      },
    ]);
    setLessonTitle('');
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setStatusMsg({ type: '', text: '' });
    setLoading(true);

    try {
      const created = await fetchAPI('/courses', {
        method: 'POST',
        body: JSON.stringify({
          title,
          subtitle,
          description,
          category,
          level,
          price: Number(price),
          thumbnail,
          lessons,
        }),
      });

      setStatusMsg({ type: 'success', text: `Success! Course "${created.title}" was created.` });
      setTitle('');
      setSubtitle('');
      setDescription('');
      setLessons([]);
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Error creating course' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto' }}>
      
      <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>Instructor Studio Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>Publish video courses and manage curriculum lessons</p>
        </div>
        <span className="badge badge-accent" style={{ padding: '8px 14px' }}>Instructor Mode</span>
      </div>

      {statusMsg.text && (
        <div 
          style={{ 
            padding: '14px 18px', 
            borderRadius: 'var(--radius-sm)', 
            marginBottom: '24px',
            background: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            color: statusMsg.type === 'success' ? 'var(--success)' : 'var(--danger)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          {statusMsg.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          {statusMsg.text}
        </div>
      )}

      <form onSubmit={handleCreateCourse} className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
          Course Details
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Course Title</label>
            <input
              type="text"
              required
              className="input-field"
              placeholder="e.g. Master Node.js Security & Authentication"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Category</label>
            <select className="input-field" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="Development">Development</option>
              <option value="Design">Design</option>
              <option value="AI & Data">AI & Data</option>
              <option value="Business">Business</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Subtitle / Short Tagline</label>
          <input
            type="text"
            className="input-field"
            placeholder="A short punchy summary for the course card"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Full Description</label>
          <textarea
            required
            rows="4"
            className="input-field"
            placeholder="Detailed course description, prerequisites, and learning goals..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Level</label>
            <select className="input-field" value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="All Levels">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Price ($ USD)</label>
            <input
              type="number"
              step="0.01"
              className="input-field"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Thumbnail Image URL</label>
            <input
              type="text"
              className="input-field"
              value={thumbnail}
              onChange={(e) => setThumbnail(e.target.value)}
            />
          </div>
        </div>

        {/* Lesson Builder Sub-section */}
        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Video size={18} color="var(--accent)" /> Add Video Lessons ({lessons.length} added)
          </h4>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <input
              type="text"
              className="input-field"
              placeholder="Lesson title (e.g. 01. Getting Started)"
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
              style={{ flex: 1 }}
            />
            <input
              type="text"
              className="input-field"
              placeholder="Video URL (.mp4 / stream)"
              value={lessonVideoUrl}
              onChange={(e) => setLessonVideoUrl(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="button" onClick={handleAddLesson} className="btn btn-secondary">
              <Plus size={18} /> Add Lesson
            </button>
          </div>

          {lessons.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {lessons.map((l, i) => (
                <div key={i} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                  <span><strong>Lesson {i + 1}:</strong> {l.title}</span>
                  <span className="badge badge-accent">{l.isFreePreview ? 'Free Preview' : 'Locked'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ marginTop: '12px' }}>
          {loading ? 'Publishing Course...' : 'Publish Course to Catalog'}
        </button>

      </form>

    </div>
  );
};
