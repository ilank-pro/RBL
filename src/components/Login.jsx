import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  return (
    <div className="auth-container">
      <h1 style={{ marginBottom: '30px' }}>Pop Party Arcade</h1>
      <p style={{ marginBottom: '40px' }}>Login to compete!</p>
      
      <button className="btn-social btn-fb" onClick={() => onLogin('fb')}>
        Login with Facebook
      </button>
      
      <button className="btn-social btn-ig" onClick={() => onLogin('ig')}>
        Login with Instagram
      </button>

      <div style={{ marginTop: '50px', fontSize: '0.8rem', opacity: 0.7 }}>
        Compete with friends in real-time!
      </div>
    </div>
  );
};

export default Login;
