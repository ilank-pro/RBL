import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import useAdminAuth from '../hooks/useAdminAuth';

const CATEGORIES = ['rebus', 'symbols', 'puzzles', 'sequence', 'Contextual', 'Dingbats'];

const Admin = ({ user }) => {
  const { isInAllowlist, isPasswordVerified, isAdmin, passwordError, verifyPassword } = useAdminAuth(user);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('add');

  // If no user or not in allowlist, show access denied
  if (!user) {
    return (
      <div className="admin-container">
        <div className="admin-content">
          <h1>Admin Dashboard</h1>
          <div className="admin-error">
            <p>Please log in first to access the admin dashboard.</p>
            <Link to="/" className="admin-button">Go to Login</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isInAllowlist) {
    return (
      <div className="admin-container">
        <div className="admin-content">
          <h1>Access Denied</h1>
          <div className="admin-error">
            <p>Your account does not have admin privileges.</p>
            <p style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '10px' }}>
              Your Meta ID: {user?.metaId || 'Unknown'}
            </p>
            <Link to="/" className="admin-button">Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  // Password verification step
  if (!isPasswordVerified) {
    return (
      <div className="admin-container">
        <div className="admin-content">
          <h1>Admin Dashboard</h1>
          <p className="admin-subtitle">Enter admin password to continue</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              verifyPassword(password);
            }}
            className="admin-password-form"
          >
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin Password"
              className="admin-input"
              autoFocus
            />
            {passwordError && <div className="admin-field-error">{passwordError}</div>}
            <button type="submit" className="admin-button primary">
              Verify
            </button>
          </form>
          <Link to="/" className="admin-link">Back to Home</Link>
        </div>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div className="admin-container">
      <div className="admin-content wide">
        <div className="admin-header">
          <h1>Admin Dashboard</h1>
          <Link to="/" className="admin-button small">Back to Game</Link>
        </div>

        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => setActiveTab('add')}
          >
            Add Card
          </button>
          <button
            className={`admin-tab ${activeTab === 'bulk' ? 'active' : ''}`}
            onClick={() => setActiveTab('bulk')}
          >
            Bulk Upload
          </button>
          <button
            className={`admin-tab ${activeTab === 'manage' ? 'active' : ''}`}
            onClick={() => setActiveTab('manage')}
          >
            Manage Cards
          </button>
        </div>

        <div className="admin-tab-content">
          {activeTab === 'add' && <AddCardForm />}
          {activeTab === 'bulk' && <BulkUploadForm />}
          {activeTab === 'manage' && <ManageCards />}
        </div>
      </div>
    </div>
  );
};

// Single Card Upload Form
const AddCardForm = () => {
  const [formData, setFormData] = useState({
    answer: '',
    alternateAnswers: '',
    difficulty: 3,
    category: 'rebus',
    hints: [{ text: '', score: 3 }],
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const fileInputRef = useRef(null);

  const generateUploadUrl = useMutation(api.puzzles.generateUploadUrl);
  const getStorageUrl = useMutation(api.puzzles.getStorageUrl);
  const createPuzzle = useMutation(api.puzzles.createPuzzle);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const addHint = () => {
    setFormData({
      ...formData,
      hints: [...formData.hints, { text: '', score: 3 }],
    });
  };

  const removeHint = (index) => {
    setFormData({
      ...formData,
      hints: formData.hints.filter((_, i) => i !== index),
    });
  };

  const updateHint = (index, field, value) => {
    const newHints = [...formData.hints];
    newHints[index] = { ...newHints[index], [field]: value };
    setFormData({ ...formData, hints: newHints });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) {
      setMessage({ type: 'error', text: 'Please select an image' });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      // Upload image to Convex storage
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': imageFile.type },
        body: imageFile,
      });
      const { storageId } = await result.json();

      // Get the public URL
      const imageUrl = await getStorageUrl({ storageId });

      // Create the puzzle
      await createPuzzle({
        imageId: storageId,
        imageUrl,
        answer: formData.answer,
        alternateAnswers: formData.alternateAnswers
          .split(',')
          .map((a) => a.trim())
          .filter((a) => a),
        difficulty: formData.difficulty,
        category: formData.category,
        hints: formData.hints.filter((h) => h.text.trim()),
      });

      setMessage({ type: 'success', text: 'Puzzle created successfully!' });
      // Reset form
      setFormData({
        answer: '',
        alternateAnswers: '',
        difficulty: 3,
        category: 'rebus',
        hints: [{ text: '', score: 3 }],
      });
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to create puzzle' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="admin-form">
      {message && (
        <div className={`admin-message ${message.type}`}>{message.text}</div>
      )}

      <div className="admin-form-row">
        <div className="admin-field">
          <label>Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            ref={fileInputRef}
            className="admin-file-input"
          />
          {imagePreview && (
            <div className="admin-image-preview">
              <img src={imagePreview} alt="Preview" />
            </div>
          )}
        </div>
      </div>

      <div className="admin-form-row">
        <div className="admin-field">
          <label>Answer</label>
          <input
            type="text"
            value={formData.answer}
            onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
            placeholder="Primary answer"
            className="admin-input"
            required
          />
        </div>
        <div className="admin-field">
          <label>Alternate Answers (comma-separated)</label>
          <input
            type="text"
            value={formData.alternateAnswers}
            onChange={(e) => setFormData({ ...formData, alternateAnswers: e.target.value })}
            placeholder="alt1, alt2, alt3"
            className="admin-input"
          />
        </div>
      </div>

      <div className="admin-form-row">
        <div className="admin-field">
          <label>Difficulty: {formData.difficulty}</label>
          <input
            type="range"
            min="1"
            max="5"
            value={formData.difficulty}
            onChange={(e) => setFormData({ ...formData, difficulty: parseInt(e.target.value) })}
            className="admin-slider"
          />
          <div className="admin-slider-labels">
            <span>Easy</span>
            <span>Hard</span>
          </div>
        </div>
        <div className="admin-field">
          <label>Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="admin-select"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="admin-field">
        <label>Hints</label>
        {formData.hints.map((hint, index) => (
          <div key={index} className="admin-hint-row">
            <input
              type="text"
              value={hint.text}
              onChange={(e) => updateHint(index, 'text', e.target.value)}
              placeholder={`Hint ${index + 1}`}
              className="admin-input hint-input"
            />
            <div className="hint-score">
              <span>Score: {hint.score}</span>
              <input
                type="range"
                min="1"
                max="5"
                value={hint.score}
                onChange={(e) => updateHint(index, 'score', parseInt(e.target.value))}
                className="admin-slider small"
              />
            </div>
            {formData.hints.length > 1 && (
              <button type="button" onClick={() => removeHint(index)} className="admin-button danger small">
                ×
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={addHint} className="admin-button secondary small">
          + Add Hint
        </button>
      </div>

      <button type="submit" className="admin-button primary" disabled={isUploading}>
        {isUploading ? 'Uploading...' : 'Create Puzzle'}
      </button>
    </form>
  );
};

// Bulk Upload Form
const BulkUploadForm = () => {
  const [jsonData, setJsonData] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState(null);

  const createPuzzles = useMutation(api.puzzles.createPuzzles);

  const handleJsonChange = (e) => {
    const text = e.target.value;
    setJsonData(text);
    setParseError(null);
    setParsedData(null);

    if (text.trim()) {
      try {
        const data = JSON.parse(text);
        if (!Array.isArray(data)) {
          setParseError('JSON must be an array of puzzles');
        } else {
          setParsedData(data);
        }
      } catch (err) {
        setParseError('Invalid JSON: ' + err.message);
      }
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setJsonData(event.target.result);
        handleJsonChange({ target: { value: event.target.result } });
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async () => {
    if (!parsedData || parsedData.length === 0) return;

    setIsUploading(true);
    setMessage(null);

    try {
      // Transform data for Convex (images must be URLs for bulk upload)
      const puzzles = parsedData.map((p) => ({
        imageUrl: p.image || p.imageUrl,
        answer: p.answer,
        alternateAnswers: p.alternateAnswers || [],
        difficulty: p.difficulty || 3,
        category: p.category || 'rebus',
        hints: p.hints || [],
      }));

      await createPuzzles({ puzzles });
      setMessage({ type: 'success', text: `Successfully imported ${puzzles.length} puzzles!` });
      setJsonData('');
      setParsedData(null);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to import puzzles' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="admin-bulk">
      {message && (
        <div className={`admin-message ${message.type}`}>{message.text}</div>
      )}

      <div className="admin-field">
        <label>Upload JSON File</label>
        <input
          type="file"
          accept=".json"
          onChange={handleFileUpload}
          className="admin-file-input"
        />
      </div>

      <div className="admin-field">
        <label>Or paste JSON directly</label>
        <textarea
          value={jsonData}
          onChange={handleJsonChange}
          placeholder={`[
  {
    "image": "https://example.com/image.png",
    "answer": "answer text",
    "alternateAnswers": ["alt1", "alt2"],
    "difficulty": 3,
    "category": "rebus",
    "hints": [
      { "text": "A small hint", "score": 1 },
      { "text": "A big hint", "score": 5 }
    ]
  }
]`}
          className="admin-textarea"
          rows={12}
        />
      </div>

      {parseError && <div className="admin-field-error">{parseError}</div>}

      {parsedData && (
        <div className="admin-preview">
          <h3>Preview: {parsedData.length} puzzles to import</h3>
          <div className="admin-preview-list">
            {parsedData.slice(0, 5).map((p, i) => (
              <div key={i} className="admin-preview-item">
                <span className="preview-answer">{p.answer}</span>
                <span className="preview-meta">
                  {p.category || 'rebus'} | Difficulty: {p.difficulty || 3}
                </span>
              </div>
            ))}
            {parsedData.length > 5 && (
              <div className="admin-preview-more">...and {parsedData.length - 5} more</div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        className="admin-button primary"
        disabled={!parsedData || isUploading}
      >
        {isUploading ? 'Importing...' : `Import ${parsedData?.length || 0} Puzzles`}
      </button>
    </div>
  );
};

// Manage Cards
const ManageCards = () => {
  const puzzles = useQuery(api.puzzles.listPuzzles, {});
  const deletePuzzle = useMutation(api.puzzles.deletePuzzle);
  const toggleActive = useMutation(api.puzzles.togglePuzzleActive);
  const [filter, setFilter] = useState('all');

  if (!puzzles) {
    return <div className="admin-loading">Loading puzzles...</div>;
  }

  const filteredPuzzles = puzzles.filter((p) => {
    if (filter === 'active') return p.isActive;
    if (filter === 'inactive') return !p.isActive;
    return true;
  });

  const handleDelete = async (puzzleId) => {
    if (window.confirm('Are you sure you want to delete this puzzle?')) {
      await deletePuzzle({ puzzleId });
    }
  };

  return (
    <div className="admin-manage">
      <div className="admin-manage-header">
        <div className="admin-stats">
          <span>Total: {puzzles.length}</span>
          <span>Active: {puzzles.filter((p) => p.isActive).length}</span>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="admin-select small"
        >
          <option value="all">All</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      <div className="admin-cards-list">
        {filteredPuzzles.map((puzzle) => (
          <div key={puzzle._id} className={`admin-card ${!puzzle.isActive ? 'inactive' : ''}`}>
            <div className="admin-card-image">
              <img src={puzzle.imageUrl} alt={puzzle.answer} />
            </div>
            <div className="admin-card-info">
              <div className="admin-card-answer">{puzzle.answer}</div>
              <div className="admin-card-meta">
                <span className="card-category">{puzzle.category}</span>
                <span className="card-difficulty">Difficulty: {puzzle.difficulty}</span>
                <span className="card-hints">{puzzle.hints.length} hints</span>
              </div>
            </div>
            <div className="admin-card-actions">
              <button
                onClick={() => toggleActive({ puzzleId: puzzle._id })}
                className={`admin-button small ${puzzle.isActive ? 'warning' : 'success'}`}
              >
                {puzzle.isActive ? 'Disable' : 'Enable'}
              </button>
              <button
                onClick={() => handleDelete(puzzle._id)}
                className="admin-button small danger"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredPuzzles.length === 0 && (
        <div className="admin-empty">No puzzles found</div>
      )}
    </div>
  );
};

export default Admin;
