import React from 'react';
import { Link } from 'react-router-dom';

const TermsOfService = () => {
  return (
    <div className="legal-container">
      <div className="legal-content">
        <h1>Terms of Service</h1>
        <p className="legal-updated">Last Updated: December 30, 2024</p>

        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using Pop Party Arcade at rbl.quest (the "Service"), you agree to be bound
            by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use
            the Service.
          </p>
        </section>

        <section>
          <h2>2. Description of Service</h2>
          <p>
            Pop Party Arcade is a free multiplayer puzzle game that allows users to compete with friends
            in real-time. The Service includes features such as Facebook login, room creation, QR code
            invitations, and competitive gameplay.
          </p>
        </section>

        <section>
          <h2>3. User Accounts</h2>
          <p>
            To use certain features of the Service, you must log in using your Facebook account.
            You are responsible for maintaining the confidentiality of your account and for all
            activities that occur under your account.
          </p>
        </section>

        <section>
          <h2>4. User Conduct</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the Service for any unlawful purpose</li>
            <li>Harass, abuse, or harm other users</li>
            <li>Attempt to gain unauthorized access to the Service</li>
            <li>Interfere with or disrupt the Service or servers</li>
            <li>Use automated systems or bots to access the Service</li>
            <li>Impersonate any person or entity</li>
          </ul>
        </section>

        <section>
          <h2>5. Intellectual Property</h2>
          <p>
            The Service and its original content, features, and functionality are owned by Pop Party
            Arcade and are protected by international copyright, trademark, and other intellectual
            property laws. You may not copy, modify, distribute, or create derivative works without
            our express written permission.
          </p>
        </section>

        <section>
          <h2>6. User Content</h2>
          <p>
            By using the Service, you grant us a non-exclusive, royalty-free license to use your
            Facebook profile information (name and profile picture) for the purpose of providing
            the game functionality.
          </p>
        </section>

        <section>
          <h2>7. Disclaimer of Warranties</h2>
          <p>
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
            EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED,
            SECURE, OR ERROR-FREE.
          </p>
        </section>

        <section>
          <h2>8. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT,
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED
            TO YOUR USE OF THE SERVICE.
          </p>
        </section>

        <section>
          <h2>9. Termination</h2>
          <p>
            We reserve the right to terminate or suspend your access to the Service at any time,
            without prior notice or liability, for any reason, including breach of these Terms.
          </p>
        </section>

        <section>
          <h2>10. Changes to Terms</h2>
          <p>
            We may modify these Terms at any time. We will notify you of any changes by posting
            the new Terms on this page. Your continued use of the Service after changes constitutes
            acceptance of the modified Terms.
          </p>
        </section>

        <section>
          <h2>11. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with applicable laws,
            without regard to conflict of law principles.
          </p>
        </section>

        <section>
          <h2>12. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at:
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

export default TermsOfService;
