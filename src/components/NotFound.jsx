import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="not-found-emoji">🎈</div>
        <h1 className="not-found-title">Oops! Page Not Found</h1>
        <p className="not-found-message">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="not-found-button">
          Go to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
