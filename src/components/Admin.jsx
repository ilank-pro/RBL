import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import useAdminAuth from '../hooks/useAdminAuth';
import JSZip from 'jszip';

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

// Bulk Upload Form (supports JSON and ZIP files)
const BulkUploadForm = () => {
  const [uploadMode, setUploadMode] = useState('zip'); // 'zip' or 'json'
  const [jsonData, setJsonData] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [message, setMessage] = useState(null);
  const [zipFile, setZipFile] = useState(null);
  const [zipPreview, setZipPreview] = useState(null);

  const createPuzzles = useMutation(api.puzzles.createPuzzles);
  const generateUploadUrl = useMutation(api.puzzles.generateUploadUrl);
  const getStorageUrl = useMutation(api.puzzles.getStorageUrl);

  // Handle JSON text change
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

  // Handle JSON file upload
  const handleJsonFileUpload = (e) => {
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

  // Handle ZIP file selection
  const handleZipFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setZipFile(file);
    setParseError(null);
    setZipPreview(null);

    try {
      const zip = await JSZip.loadAsync(file);
      const fileNames = Object.keys(zip.files);

      // Find JSON manifest
      const jsonFiles = fileNames.filter(f => f.endsWith('.json') && !f.startsWith('__MACOSX'));
      if (jsonFiles.length === 0) {
        setParseError('No JSON manifest found in ZIP file');
        return;
      }
      if (jsonFiles.length > 1) {
        setParseError('Multiple JSON files found. Please include only one manifest.');
        return;
      }

      // Parse manifest
      const manifestContent = await zip.file(jsonFiles[0]).async('string');
      const manifest = JSON.parse(manifestContent);

      if (!Array.isArray(manifest)) {
        setParseError('JSON manifest must be an array of puzzles');
        return;
      }

      // Validate image references
      const imageFiles = fileNames.filter(f =>
        !f.endsWith('.json') &&
        !f.startsWith('__MACOSX') &&
        !f.endsWith('/') &&
        /\.(png|jpg|jpeg|gif|webp)$/i.test(f)
      );

      const missingImages = [];
      for (const puzzle of manifest) {
        // Extract filename from URL or use directly
        const imageRef = puzzle.image || puzzle.imageUrl;
        const imageFilename = imageRef.includes('/')
          ? imageRef.split('/').pop()
          : imageRef;

        if (!imageFiles.some(f => f.endsWith(imageFilename))) {
          missingImages.push(imageFilename);
        }
      }

      if (missingImages.length > 0) {
        setParseError(`Missing images in ZIP: ${missingImages.slice(0, 3).join(', ')}${missingImages.length > 3 ? ` and ${missingImages.length - 3} more` : ''}`);
        return;
      }

      // Generate pack name from filename
      const packName = file.name
        .replace('.zip', '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());

      setZipPreview({
        packName,
        puzzleCount: manifest.length,
        imageCount: imageFiles.length,
        manifest,
        imageFiles,
        zip,
      });
    } catch (err) {
      setParseError('Failed to read ZIP file: ' + err.message);
    }
  };

  // Submit ZIP upload
  const handleZipSubmit = async () => {
    if (!zipPreview) return;

    setIsUploading(true);
    setMessage(null);
    setUploadProgress({ current: 0, total: zipPreview.puzzleCount });

    const packId = crypto.randomUUID();
    const puzzlesToCreate = [];

    try {
      for (let i = 0; i < zipPreview.manifest.length; i++) {
        const puzzle = zipPreview.manifest[i];
        setUploadProgress({ current: i + 1, total: zipPreview.puzzleCount });

        // Extract filename from URL or use directly
        const imageRef = puzzle.image || puzzle.imageUrl;
        const imageFilename = imageRef.includes('/')
          ? imageRef.split('/').pop()
          : imageRef;

        // Find the image file in ZIP
        const imageFile = zipPreview.imageFiles.find(f => f.endsWith(imageFilename));
        if (!imageFile) {
          throw new Error(`Image not found: ${imageFilename}`);
        }

        // Get image blob
        const imageBlob = await zipPreview.zip.file(imageFile).async('blob');

        // Determine content type
        const ext = imageFilename.split('.').pop().toLowerCase();
        const contentType = {
          'png': 'image/png',
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'gif': 'image/gif',
          'webp': 'image/webp',
        }[ext] || 'image/png';

        // Upload to Convex storage
        const uploadUrl = await generateUploadUrl();
        const uploadResult = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': contentType },
          body: imageBlob,
        });
        const { storageId } = await uploadResult.json();

        // Get the public URL
        const imageUrl = await getStorageUrl({ storageId });

        puzzlesToCreate.push({
          imageId: storageId,
          imageUrl,
          answer: puzzle.answer,
          alternateAnswers: puzzle.alternateAnswers || [],
          difficulty: puzzle.difficulty || 3,
          category: puzzle.category || 'rebus',
          hints: puzzle.hints || [],
        });
      }

      // Create all puzzles with pack info
      await createPuzzles({
        puzzles: puzzlesToCreate,
        packId,
        packName: zipPreview.packName,
      });

      setMessage({
        type: 'success',
        text: `Successfully imported pack "${zipPreview.packName}" with ${puzzlesToCreate.length} puzzles!`,
      });
      setZipFile(null);
      setZipPreview(null);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to import pack' });
    } finally {
      setIsUploading(false);
      setUploadProgress({ current: 0, total: 0 });
    }
  };

  // Submit JSON upload
  const handleJsonSubmit = async () => {
    if (!parsedData || parsedData.length === 0) return;

    setIsUploading(true);
    setMessage(null);

    try {
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

      <div className="admin-upload-toggle">
        <button
          className={`admin-toggle-btn ${uploadMode === 'zip' ? 'active' : ''}`}
          onClick={() => setUploadMode('zip')}
        >
          Upload ZIP Pack
        </button>
        <button
          className={`admin-toggle-btn ${uploadMode === 'json' ? 'active' : ''}`}
          onClick={() => setUploadMode('json')}
        >
          Upload JSON
        </button>
      </div>

      {uploadMode === 'zip' ? (
        <>
          <div className="admin-field">
            <label>Upload ZIP File (images + JSON manifest)</label>
            <input
              type="file"
              accept=".zip"
              onChange={handleZipFileSelect}
              className="admin-file-input"
            />
          </div>

          {parseError && <div className="admin-field-error">{parseError}</div>}

          {zipPreview && (
            <div className="admin-preview">
              <h3>Pack: {zipPreview.packName}</h3>
              <div className="admin-preview-stats">
                <span>{zipPreview.puzzleCount} puzzles</span>
                <span>{zipPreview.imageCount} images</span>
              </div>
              <div className="admin-preview-list">
                {zipPreview.manifest.slice(0, 5).map((p, i) => (
                  <div key={i} className="admin-preview-item">
                    <span className="preview-answer">{p.answer}</span>
                    <span className="preview-meta">
                      {p.category || 'rebus'} | Difficulty: {p.difficulty || 3}
                    </span>
                  </div>
                ))}
                {zipPreview.manifest.length > 5 && (
                  <div className="admin-preview-more">
                    ...and {zipPreview.manifest.length - 5} more
                  </div>
                )}
              </div>
            </div>
          )}

          {isUploading && uploadProgress.total > 0 && (
            <div className="admin-progress">
              <div className="admin-progress-bar">
                <div
                  className="admin-progress-fill"
                  style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                />
              </div>
              <div className="admin-progress-text">
                Uploading {uploadProgress.current} of {uploadProgress.total} puzzles...
              </div>
            </div>
          )}

          <button
            onClick={handleZipSubmit}
            className="admin-button primary"
            disabled={!zipPreview || isUploading}
          >
            {isUploading ? 'Importing...' : `Import Pack (${zipPreview?.puzzleCount || 0} puzzles)`}
          </button>
        </>
      ) : (
        <>
          <div className="admin-field">
            <label>Upload JSON File</label>
            <input
              type="file"
              accept=".json"
              onChange={handleJsonFileUpload}
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
            onClick={handleJsonSubmit}
            className="admin-button primary"
            disabled={!parsedData || isUploading}
          >
            {isUploading ? 'Importing...' : `Import ${parsedData?.length || 0} Puzzles`}
          </button>
        </>
      )}
    </div>
  );
};

// Edit Card Modal
const EditCardModal = ({ puzzle, onClose }) => {
  const [formData, setFormData] = useState({
    answer: puzzle.answer,
    alternateAnswers: puzzle.alternateAnswers.join(', '),
    difficulty: puzzle.difficulty,
    category: puzzle.category,
    hints: puzzle.hints.length > 0 ? puzzle.hints : [{ text: '', score: 3 }],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const updatePuzzle = useMutation(api.puzzles.updatePuzzle);

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
    setIsSaving(true);
    setMessage(null);

    try {
      await updatePuzzle({
        puzzleId: puzzle._id,
        answer: formData.answer,
        alternateAnswers: formData.alternateAnswers
          .split(',')
          .map((a) => a.trim())
          .filter((a) => a),
        difficulty: formData.difficulty,
        category: formData.category,
        hints: formData.hints.filter((h) => h.text.trim()),
      });

      setMessage({ type: 'success', text: 'Puzzle updated successfully!' });
      setTimeout(() => onClose(), 1000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update puzzle' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h2>Edit Puzzle</h2>
          <button onClick={onClose} className="admin-modal-close">×</button>
        </div>

        <div className="admin-modal-image">
          <img src={puzzle.imageUrl} alt={puzzle.answer} />
        </div>

        <form onSubmit={handleSubmit} className="admin-form">
          {message && (
            <div className={`admin-message ${message.type}`}>{message.text}</div>
          )}

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

          <div className="admin-modal-actions">
            <button type="button" onClick={onClose} className="admin-button secondary">
              Cancel
            </button>
            <button type="submit" className="admin-button primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Manage Cards
const ManageCards = () => {
  const puzzles = useQuery(api.puzzles.listPuzzles, {});
  const packs = useQuery(api.puzzles.listPacks);
  const deletePuzzle = useMutation(api.puzzles.deletePuzzle);
  const deletePackPuzzles = useMutation(api.puzzles.deletePackPuzzles);
  const toggleActive = useMutation(api.puzzles.togglePuzzleActive);
  const [statusFilter, setStatusFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [hintsFilter, setHintsFilter] = useState('all');
  const [packFilter, setPackFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPuzzle, setEditingPuzzle] = useState(null);
  const [message, setMessage] = useState(null);

  if (!puzzles) {
    return <div className="admin-loading">Loading puzzles...</div>;
  }

  const filteredPuzzles = puzzles.filter((p) => {
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesAnswer = p.answer.toLowerCase().includes(query);
      const matchesAltAnswers = p.alternateAnswers.some(a => a.toLowerCase().includes(query));
      if (!matchesAnswer && !matchesAltAnswers) return false;
    }

    // Status filter
    if (statusFilter === 'active' && !p.isActive) return false;
    if (statusFilter === 'inactive' && p.isActive) return false;

    // Difficulty filter
    if (difficultyFilter !== 'all' && p.difficulty !== parseInt(difficultyFilter)) return false;

    // Hints filter
    if (hintsFilter === '0' && p.hints.length !== 0) return false;
    if (hintsFilter === '1-2' && (p.hints.length < 1 || p.hints.length > 2)) return false;
    if (hintsFilter === '3+' && p.hints.length < 3) return false;

    // Pack filter
    if (packFilter !== 'all') {
      if (packFilter === 'none' && p.packId) return false;
      if (packFilter !== 'none' && p.packId !== packFilter) return false;
    }

    return true;
  });

  const handleDelete = async (puzzleId) => {
    if (window.confirm('Are you sure you want to delete this puzzle?')) {
      await deletePuzzle({ puzzleId });
    }
  };

  const handleDeletePack = async () => {
    if (packFilter === 'all' || packFilter === 'none') return;

    const pack = packs?.find(p => p.packId === packFilter);
    const packName = pack?.packName || 'this pack';

    if (window.confirm(`Are you sure you want to delete ALL ${pack?.count || 0} puzzles in "${packName}"? This cannot be undone.`)) {
      try {
        const result = await deletePackPuzzles({ packId: packFilter });
        setMessage({ type: 'success', text: `Deleted ${result.deleted} puzzles from "${packName}"` });
        setPackFilter('all');
      } catch (err) {
        setMessage({ type: 'error', text: err.message || 'Failed to delete pack' });
      }
    }
  };

  return (
    <div className="admin-manage">
      {editingPuzzle && (
        <EditCardModal
          puzzle={editingPuzzle}
          onClose={() => setEditingPuzzle(null)}
        />
      )}

      {message && (
        <div className={`admin-message ${message.type}`}>{message.text}</div>
      )}

      <div className="admin-search-bar">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by answer..."
          className="admin-input admin-search-input"
        />
      </div>

      <div className="admin-manage-header">
        <div className="admin-stats">
          <span>Total: {puzzles.length}</span>
          <span>Showing: {filteredPuzzles.length}</span>
          <span>Active: {puzzles.filter((p) => p.isActive).length}</span>
        </div>
        <div className="admin-filters">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-select small"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="admin-select small"
          >
            <option value="all">All Difficulty</option>
            <option value="1">Difficulty 1</option>
            <option value="2">Difficulty 2</option>
            <option value="3">Difficulty 3</option>
            <option value="4">Difficulty 4</option>
            <option value="5">Difficulty 5</option>
          </select>
          <select
            value={hintsFilter}
            onChange={(e) => setHintsFilter(e.target.value)}
            className="admin-select small"
          >
            <option value="all">All Hints</option>
            <option value="0">No Hints</option>
            <option value="1-2">1-2 Hints</option>
            <option value="3+">3+ Hints</option>
          </select>
          <select
            value={packFilter}
            onChange={(e) => setPackFilter(e.target.value)}
            className="admin-select small"
          >
            <option value="all">All Packs</option>
            <option value="none">No Pack</option>
            {packs?.map((pack) => (
              <option key={pack.packId} value={pack.packId}>
                {pack.packName} ({pack.count})
              </option>
            ))}
          </select>
        </div>
      </div>

      {packFilter !== 'all' && packFilter !== 'none' && (
        <div className="admin-pack-actions">
          <span className="admin-pack-label">
            Viewing pack: {packs?.find(p => p.packId === packFilter)?.packName}
          </span>
          <button
            onClick={handleDeletePack}
            className="admin-button danger small"
          >
            Delete Entire Pack
          </button>
        </div>
      )}

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
                {puzzle.packName && (
                  <span className="card-pack">{puzzle.packName}</span>
                )}
              </div>
            </div>
            <div className="admin-card-actions">
              <button
                onClick={() => setEditingPuzzle(puzzle)}
                className="admin-button small"
              >
                Edit
              </button>
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
