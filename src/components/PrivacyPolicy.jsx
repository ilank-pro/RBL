import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <div className="legal-container">
      <div className="legal-content">
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last Updated: December 30, 2024</p>

        <section>
          <h2>1. Introduction</h2>
          <p>
            Welcome to Pop Party Arcade ("we," "our," or "us"). We are committed to protecting your privacy
            and ensuring you understand how we collect, use, and safeguard your information when you use
            our multiplayer puzzle game service at rbl.quest (the "Service").
          </p>
        </section>

        <section>
          <h2>2. Information We Collect</h2>
          <p>When you use our Service, we may collect the following information:</p>
          <ul>
            <li><strong>Facebook Profile Information:</strong> When you log in with Facebook, we receive your public profile information including your name and profile picture.</li>
            <li><strong>User ID:</strong> A unique identifier from Facebook to identify your account.</li>
            <li><strong>Game Data:</strong> Your game scores, room codes, and multiplayer session information.</li>
          </ul>
        </section>

        <section>
          <h2>3. How We Use Your Information</h2>
          <p>We use the collected information for the following purposes:</p>
          <ul>
            <li>To provide and maintain the multiplayer game functionality</li>
            <li>To display your name and avatar to other players during games</li>
            <li>To match you with other players in game rooms</li>
            <li>To track game scores and results</li>
            <li>To improve and optimize our Service</li>
          </ul>
        </section>

        <section>
          <h2>4. Data Storage and Security</h2>
          <p>
            Your data is stored securely using Convex, a third-party database service. We implement
            appropriate technical and organizational measures to protect your personal information
            against unauthorized access, alteration, disclosure, or destruction.
          </p>
        </section>

        <section>
          <h2>5. Third-Party Services</h2>
          <p>Our Service uses the following third-party services:</p>
          <ul>
            <li><strong>Facebook Login:</strong> For authentication and profile information</li>
            <li><strong>Convex:</strong> For real-time database and backend services</li>
            <li><strong>Vercel:</strong> For hosting the application</li>
          </ul>
          <p>These services have their own privacy policies governing the use of your information.</p>
        </section>

        <section>
          <h2>6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Withdraw consent for data processing</li>
          </ul>
          <p>
            To exercise these rights, please visit our <Link to="/delete-data">Data Deletion</Link> page
            or contact us at the email below.
          </p>
        </section>

        <section>
          <h2>7. Data Retention</h2>
          <p>
            We retain your personal data only for as long as necessary to provide the Service and
            fulfill the purposes described in this policy. You may request deletion of your data at any time.
          </p>
        </section>

        <section>
          <h2>8. Children's Privacy</h2>
          <p>
            Our Service is not intended for children under the age of 13. We do not knowingly collect
            personal information from children under 13. If you believe we have collected information
            from a child under 13, please contact us immediately.
          </p>
        </section>

        <section>
          <h2>9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes by
            posting the new Privacy Policy on this page and updating the "Last Updated" date.
          </p>
        </section>

        <section>
          <h2>10. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at:
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

export default PrivacyPolicy;
