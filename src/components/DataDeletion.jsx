import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const DataDeletion = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real implementation, this would send to a backend
    // For now, we just show a confirmation message
    setSubmitted(true);
  };

  return (
    <div className="legal-container">
      <div className="legal-content">
        <h1>User Data Deletion</h1>
        <p className="legal-updated">Last Updated: December 30, 2024</p>

        <section>
          <h2>Your Data Rights</h2>
          <p>
            At Pop Party Arcade, we respect your privacy and your right to control your personal data.
            You can request the deletion of all data associated with your account at any time.
          </p>
        </section>

        <section>
          <h2>What Data We Store</h2>
          <p>When you use our service, we store the following information:</p>
          <ul>
            <li><strong>Facebook User ID:</strong> A unique identifier from your Facebook account</li>
            <li><strong>Display Name:</strong> Your name as it appears on Facebook</li>
            <li><strong>Profile Picture URL:</strong> A link to your Facebook profile picture</li>
            <li><strong>Game History:</strong> Your game scores and room participation records</li>
          </ul>
        </section>

        <section>
          <h2>How to Request Data Deletion</h2>
          <p>You can request deletion of your data by:</p>
          <ol>
            <li>Submitting the form below with the email associated with your Facebook account</li>
            <li>Sending an email directly to <strong>placeholder@rbl.quest</strong></li>
          </ol>
        </section>

        {!submitted ? (
          <section>
            <h2>Data Deletion Request Form</h2>
            <form onSubmit={handleSubmit} className="deletion-form">
              <div className="form-group">
                <label htmlFor="email">Email Address (associated with your Facebook account):</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your-email@example.com"
                  required
                  className="form-input"
                />
              </div>
              <button type="submit" className="legal-button delete-button">
                Request Data Deletion
              </button>
            </form>
          </section>
        ) : (
          <section className="confirmation-section">
            <h2>Request Submitted</h2>
            <div className="confirmation-message">
              <p>
                Thank you for your request. We have received your data deletion request for: <strong>{email}</strong>
              </p>
              <p>
                Your data will be deleted within <strong>30 days</strong>. You will receive a confirmation
                email once the deletion is complete.
              </p>
            </div>
          </section>
        )}

        <section>
          <h2>What Happens After Deletion</h2>
          <ul>
            <li>All your personal data will be permanently removed from our systems</li>
            <li>Your game history and scores will be deleted</li>
            <li>You will need to log in again to create a new account if you wish to use the service</li>
            <li>This action cannot be undone</li>
          </ul>
        </section>

        <section>
          <h2>Processing Time</h2>
          <p>
            Data deletion requests are typically processed within <strong>30 days</strong>.
            You will receive an email confirmation once your data has been deleted.
          </p>
        </section>

        <section>
          <h2>Contact Us</h2>
          <p>
            If you have any questions about data deletion, please contact us at:
          </p>
          <p><strong>Email:</strong> placeholder@rbl.quest</p>
        </section>

        <div className="legal-footer">
          <Link to="/" className="legal-button">Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default DataDeletion;
