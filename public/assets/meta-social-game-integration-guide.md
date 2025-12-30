# Meta Social Integration for Game - Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Meta App Setup](#meta-app-setup)
4. [Platform-Specific Implementation](#platform-specific-implementation)
5. [Authentication Flow](#authentication-flow)
6. [Sharing Game Results](#sharing-game-results)
7. [Security Best Practices](#security-best-practices)
8. [Testing](#testing)
9. [Deployment Checklist](#deployment-checklist)

---

## Overview

This guide covers implementing Facebook/Instagram login and game result sharing using Meta's official SDKs. 

**Important Notes:**
- Instagram login uses Facebook accounts (Instagram shares the same account system)
- Instagram feed posting is NOT available via API (platform restriction)
- Instagram Story sharing is available via deep linking
- Facebook feed posting requires app review and specific permissions

---

## Prerequisites

### 1. Required Accounts
- [ ] Facebook Developer Account (https://developers.facebook.com)
- [ ] Business verification (required for certain permissions)
- [ ] Test users for development

### 2. Technical Requirements
- [ ] HTTPS-enabled domain (required for web apps)
- [ ] Server backend for secure token handling
- [ ] SSL certificate for production

### 3. Development Environment
- **Web:** Node.js 16+, modern browser
- **iOS:** Xcode 14+, iOS 13+, CocoaPods or SPM
- **Android:** Android Studio, minSdkVersion 21+, Gradle

---

## Meta App Setup

### Step 1: Create a Meta App

1. Go to https://developers.facebook.com
2. Click "My Apps" → "Create App"
3. Select "Other" as use case
4. Choose "Business" app type
5. Fill in app details:
   - **App Name:** YourGameName
   - **App Contact Email:** your-email@domain.com
   - **Business Account:** Select or create one

### Step 2: Configure App Products

Add these products to your app:

#### Facebook Login
1. In dashboard, click "Add Product"
2. Select "Facebook Login"
3. Choose your platform (Web, iOS, Android)

#### Configure Settings

**For Web Applications:**
```
Settings → Basic:
- App Domains: yourgame.com
- Privacy Policy URL: https://yourgame.com/privacy
- Terms of Service URL: https://yourgame.com/terms

Facebook Login → Settings:
- Valid OAuth Redirect URIs: https://yourgame.com/auth/callback
- Deauthorize Callback URL: https://yourgame.com/auth/deauthorize
- Client OAuth Login: Yes
- Web OAuth Login: Yes
```

**For iOS Applications:**
```
Settings → Basic:
- Bundle ID: com.yourcompany.yourgame
- iPhone Store ID: (your app store ID)

Settings → Advanced:
- Add URL Scheme: fb{your-app-id}
```

**For Android Applications:**
```
Settings → Basic:
- Google Play Package Name: com.yourcompany.yourgame
- Key Hashes: (your release and debug key hashes)

Generate key hash:
keytool -exportcert -alias androiddebugkey -keystore ~/.android/debug.keystore | openssl sha1 -binary | openssl base64
```

### Step 3: Request Permissions

Navigate to **App Review → Permissions and Features**

**Required for Login:**
- `public_profile` (approved by default)
- `email` (approved by default)

**Required for Posting:**
- `pages_manage_posts` (requires review)
- `pages_read_engagement` (requires review)
- `publish_video` (for video posts, requires review)

**For Instagram:**
- `instagram_basic` (requires review)
- `instagram_content_publish` (requires review)

### Step 4: Save Your Credentials

```
App ID: {your-app-id}
App Secret: {your-app-secret}
```

⚠️ **Never expose App Secret in client-side code!**

---

## Platform-Specific Implementation

### WEB IMPLEMENTATION

#### 1. Install Facebook JavaScript SDK

Add to your HTML `<head>`:

```html
<script>
  window.fbAsyncInit = function() {
    FB.init({
      appId      : 'YOUR_APP_ID',
      cookie     : true,
      xfbml      : true,
      version    : 'v19.0'
    });
      
    FB.AppEvents.logPageView();   
  };

  (function(d, s, id){
     var js, fjs = d.getElementsByTagName(s)[0];
     if (d.getElementById(id)) {return;}
     js = d.createElement(s); js.id = id;
     js.src = "https://connect.facebook.net/en_US/sdk.js";
     fjs.parentNode.insertBefore(js, fjs);
   }(document, 'script', 'facebook-jssdk'));
</script>
```

#### 2. Implement Login

```javascript
// Login function
function loginWithFacebook() {
  FB.login(function(response) {
    if (response.authResponse) {
      console.log('Welcome! Fetching your information...');
      
      // Get user info
      FB.api('/me', { fields: 'id,name,email,picture' }, function(userInfo) {
        console.log('User Info:', userInfo);
        
        // Send token to your backend for verification
        const accessToken = response.authResponse.accessToken;
        sendTokenToBackend(accessToken, userInfo);
      });
    } else {
      console.log('User cancelled login or did not fully authorize.');
    }
  }, {
    scope: 'public_profile,email',
    return_scopes: true
  });
}

// Check login status
function checkLoginStatus() {
  FB.getLoginStatus(function(response) {
    if (response.status === 'connected') {
      // User is logged in
      const userId = response.authResponse.userID;
      const accessToken = response.authResponse.accessToken;
      loadUserData(userId, accessToken);
    } else {
      // User is not logged in
      showLoginButton();
    }
  });
}

// Logout function
function logoutFromFacebook() {
  FB.logout(function(response) {
    console.log('User logged out');
    clearUserSession();
  });
}
```

#### 3. Backend Token Verification (Node.js/Express)

```javascript
const express = require('express');
const axios = require('axios');
const app = express();

const APP_ID = process.env.FB_APP_ID;
const APP_SECRET = process.env.FB_APP_SECRET;

app.post('/api/auth/facebook', async (req, res) => {
  const { accessToken } = req.body;
  
  try {
    // Verify token with Facebook
    const debugResponse = await axios.get(
      `https://graph.facebook.com/debug_token`,
      {
        params: {
          input_token: accessToken,
          access_token: `${APP_ID}|${APP_SECRET}`
        }
      }
    );
    
    const tokenData = debugResponse.data.data;
    
    // Verify token is valid and for your app
    if (!tokenData.is_valid || tokenData.app_id !== APP_ID) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    // Get user info
    const userResponse = await axios.get(
      `https://graph.facebook.com/v19.0/me`,
      {
        params: {
          fields: 'id,name,email,picture',
          access_token: accessToken
        }
      }
    );
    
    const userData = userResponse.data;
    
    // Create session or JWT token for your app
    const sessionToken = createSessionToken(userData);
    
    res.json({
      success: true,
      user: userData,
      sessionToken: sessionToken
    });
    
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});
```

---

### iOS IMPLEMENTATION

#### 1. Install Facebook SDK

**Using CocoaPods** (Podfile):
```ruby
pod 'FacebookLogin'
pod 'FacebookCore'
pod 'FacebookShare'
```

**Using Swift Package Manager:**
```
https://github.com/facebook/facebook-ios-sdk
```

#### 2. Configure Info.plist

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>fbYOUR_APP_ID</string>
    </array>
  </dict>
</array>

<key>FacebookAppID</key>
<string>YOUR_APP_ID</string>

<key>FacebookClientToken</key>
<string>YOUR_CLIENT_TOKEN</string>

<key>FacebookDisplayName</key>
<string>YourGameName</string>

<key>LSApplicationQueriesSchemes</key>
<array>
  <string>fbapi</string>
  <string>fb-messenger-share-api</string>
  <string>fbauth2</string>
  <string>fbshareextension</string>
</array>
```

#### 3. Initialize SDK (AppDelegate.swift)

```swift
import FacebookCore
import UIKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        
        ApplicationDelegate.shared.application(
            application,
            didFinishLaunchingWithOptions: launchOptions
        )
        
        return true
    }
    
    func application(
        _ app: UIApplication,
        open url: URL,
        options: [UIApplication.OpenURLOptionsKey : Any] = [:]
    ) -> Bool {
        
        return ApplicationDelegate.shared.application(
            app,
            open: url,
            options: options
        )
    }
}
```

#### 4. Implement Login (Swift)

```swift
import FacebookLogin
import FacebookCore

class LoginViewController: UIViewController {
    
    let loginButton = FBLoginButton()
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Setup login button
        loginButton.permissions = ["public_profile", "email"]
        loginButton.delegate = self
        
        view.addSubview(loginButton)
        
        // Check if already logged in
        if let token = AccessToken.current, !token.isExpired {
            loadUserData()
        }
    }
    
    func loadUserData() {
        let request = GraphRequest(
            graphPath: "me",
            parameters: ["fields": "id, name, email, picture.type(large)"]
        )
        
        request.start { _, result, error in
            if let error = error {
                print("Error: \(error.localizedDescription)")
                return
            }
            
            guard let userData = result as? [String: Any] else { return }
            
            let userId = userData["id"] as? String ?? ""
            let name = userData["name"] as? String ?? ""
            let email = userData["email"] as? String ?? ""
            
            if let picture = userData["picture"] as? [String: Any],
               let data = picture["data"] as? [String: Any],
               let imageUrl = data["url"] as? String {
                
                print("Profile Image URL: \(imageUrl)")
            }
            
            // Update UI with user data
            self.updateUIWithUser(id: userId, name: name, email: email)
        }
    }
    
    func updateUIWithUser(id: String, name: String, email: String) {
        // Update your game UI
    }
}

extension LoginViewController: LoginButtonDelegate {
    
    func loginButton(_ loginButton: FBLoginButton, didCompleteWith result: LoginManagerLoginResult?, error: Error?) {
        if let error = error {
            print("Login error: \(error.localizedDescription)")
            return
        }
        
        guard let result = result, !result.isCancelled else {
            print("User cancelled login")
            return
        }
        
        print("Login successful!")
        loadUserData()
    }
    
    func loginButtonDidLogOut(_ loginButton: FBLoginButton) {
        print("User logged out")
        // Clear user session
    }
}
```

---

### ANDROID IMPLEMENTATION

#### 1. Add Dependencies (build.gradle)

```gradle
dependencies {
    implementation 'com.facebook.android:facebook-login:latest.release'
    implementation 'com.facebook.android:facebook-share:latest.release'
}
```

#### 2. Configure AndroidManifest.xml

```xml
<manifest>
    <application>
        
        <meta-data
            android:name="com.facebook.sdk.ApplicationId"
            android:value="@string/facebook_app_id"/>
        
        <meta-data
            android:name="com.facebook.sdk.ClientToken"
            android:value="@string/facebook_client_token"/>
        
        <activity
            android:name="com.facebook.FacebookActivity"
            android:configChanges="keyboard|keyboardHidden|screenLayout|screenSize|orientation"
            android:label="@string/app_name" />
        
        <activity
            android:name="com.facebook.CustomTabActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="@string/fb_login_protocol_scheme" />
            </intent-filter>
        </activity>
        
    </application>
    
    <uses-permission android:name="android.permission.INTERNET"/>
</manifest>
```

#### 3. Configure strings.xml

```xml
<resources>
    <string name="facebook_app_id">YOUR_APP_ID</string>
    <string name="fb_login_protocol_scheme">fbYOUR_APP_ID</string>
    <string name="facebook_client_token">YOUR_CLIENT_TOKEN</string>
</resources>
```

#### 4. Implement Login (Kotlin)

```kotlin
import com.facebook.CallbackManager
import com.facebook.FacebookCallback
import com.facebook.FacebookException
import com.facebook.login.LoginManager
import com.facebook.login.LoginResult
import com.facebook.GraphRequest
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity

class LoginActivity : AppCompatActivity() {
    
    private lateinit var callbackManager: CallbackManager
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        callbackManager = CallbackManager.Factory.create()
        
        // Register callback
        LoginManager.getInstance().registerCallback(
            callbackManager,
            object : FacebookCallback<LoginResult> {
                override fun onSuccess(result: LoginResult) {
                    println("Login successful!")
                    loadUserData(result.accessToken.token)
                }
                
                override fun onCancel() {
                    println("Login cancelled")
                }
                
                override fun onError(error: FacebookException) {
                    println("Login error: ${error.message}")
                }
            }
        )
        
        // Check if already logged in
        val accessToken = com.facebook.AccessToken.getCurrentAccessToken()
        val isLoggedIn = accessToken != null && !accessToken.isExpired
        
        if (isLoggedIn) {
            loadUserData(accessToken!!.token)
        }
    }
    
    fun loginWithFacebook() {
        LoginManager.getInstance().logInWithReadPermissions(
            this,
            listOf("public_profile", "email")
        )
    }
    
    private fun loadUserData(accessToken: String) {
        val request = GraphRequest.newMeRequest(
            com.facebook.AccessToken.getCurrentAccessToken()
        ) { jsonObject, response ->
            if (jsonObject != null) {
                val userId = jsonObject.getString("id")
                val name = jsonObject.getString("name")
                val email = jsonObject.optString("email", "")
                
                // Get profile picture
                val pictureObject = jsonObject.getJSONObject("picture")
                val dataObject = pictureObject.getJSONObject("data")
                val profilePicUrl = dataObject.getString("url")
                
                // Update UI
                updateUIWithUser(userId, name, email, profilePicUrl)
            }
        }
        
        val parameters = Bundle()
        parameters.putString("fields", "id,name,email,picture.type(large)")
        request.parameters = parameters
        request.executeAsync()
    }
    
    private fun updateUIWithUser(id: String, name: String, email: String, imageUrl: String) {
        // Update your game UI
    }
    
    fun logout() {
        LoginManager.getInstance().logOut()
        // Clear user session
    }
    
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        callbackManager.onActivityResult(requestCode, resultCode, data)
    }
}
```

---

## Authentication Flow

### Complete Flow Diagram

```
User clicks "Login with Facebook"
           ↓
Facebook Login Dialog Opens
           ↓
User grants permissions
           ↓
App receives Access Token
           ↓
Send token to YOUR backend
           ↓
Backend verifies with Facebook
           ↓
Backend creates session
           ↓
Return session to client
           ↓
Store session securely
           ↓
Load user profile & game data
```

### Token Management

**Access Token Lifecycle:**
- Short-lived tokens: Valid for ~2 hours
- Long-lived tokens: Valid for ~60 days
- Exchange short-lived for long-lived server-side

**Exchange Token (Backend):**

```javascript
async function exchangeToken(shortLivedToken) {
  const response = await axios.get(
    'https://graph.facebook.com/v19.0/oauth/access_token',
    {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: APP_ID,
        client_secret: APP_SECRET,
        fb_exchange_token: shortLivedToken
      }
    }
  );
  
  return response.data.access_token;
}
```

---

## Sharing Game Results

### Option 1: Facebook Feed Sharing (Requires Review)

**⚠️ Important:** Feed posting requires app review and `pages_manage_posts` permission.

#### Web Implementation

```javascript
function shareGameResultToFeed(score, level, imageUrl) {
  FB.ui({
    method: 'share',
    href: 'https://yourgame.com/result?score=' + score,
    quote: `I just scored ${score} points on level ${level}! Can you beat my score?`,
  }, function(response) {
    if (response && !response.error_message) {
      console.log('Post was shared successfully');
    } else {
      console.log('Error sharing post');
    }
  });
}

// Alternative: Share Dialog (no permissions required)
function shareGameDialog(score, level) {
  FB.ui({
    method: 'share',
    href: 'https://yourgame.com',
    hashtag: '#YourGameName'
  }, function(response){});
}
```

#### iOS Implementation

```swift
import FacebookShare

func shareGameResult(score: Int, level: Int) {
    guard let url = URL(string: "https://yourgame.com/result?score=\(score)") else {
        return
    }
    
    let content = ShareLinkContent()
    content.contentURL = url
    content.quote = "I just scored \(score) points on level \(level)! Can you beat my score?"
    content.hashtag = Hashtag("#YourGameName")
    
    let dialog = ShareDialog(
        viewController: self,
        content: content,
        delegate: self
    )
    
    dialog.show()
}

extension GameViewController: SharingDelegate {
    func sharer(_ sharer: Sharing, didCompleteWithResults results: [String : Any]) {
        print("Share successful")
    }
    
    func sharer(_ sharer: Sharing, didFailWithError error: Error) {
        print("Share failed: \(error.localizedDescription)")
    }
    
    func sharerDidCancel(_ sharer: Sharing) {
        print("Share cancelled")
    }
}
```

#### Android Implementation

```kotlin
import com.facebook.share.model.ShareLinkContent
import com.facebook.share.widget.ShareDialog

fun shareGameResult(score: Int, level: Int) {
    val content = ShareLinkContent.Builder()
        .setContentUrl(Uri.parse("https://yourgame.com/result?score=$score"))
        .setQuote("I just scored $score points on level $level! Can you beat my score?")
        .build()
    
    val shareDialog = ShareDialog(this)
    
    if (ShareDialog.canShow(ShareLinkContent::class.java)) {
        shareDialog.show(content)
    }
}
```

### Option 2: Instagram Story Sharing (Recommended)

Instagram allows sharing to Stories via deep linking. This works without app review!

#### Generate Story-Compatible Image

Your backend should generate a story image with:
- 9:16 aspect ratio (1080x1920px recommended)
- Game results overlaid on image
- Player name and score
- Branding

#### Web Implementation

```javascript
function shareToInstagramStory(imageUrl, score) {
  // Instagram Story sharing works via deep link on mobile
  // For web, provide download + instructions
  
  if (isMobileDevice()) {
    const storyUrl = `instagram://story-camera`;
    window.location.href = storyUrl;
  } else {
    alert('Please use Instagram mobile app to share to Stories');
    // Provide QR code or deep link
  }
}
```

#### iOS Implementation

```swift
import UIKit

func shareToInstagramStory(image: UIImage, score: Int) {
    guard let instagramURL = URL(string: "instagram-stories://share") else {
        return
    }
    
    if UIApplication.shared.canOpenURL(instagramURL) {
        // Prepare background image
        guard let imageData = image.pngData() else { return }
        
        let pasteboardItems: [[String: Any]] = [
            [
                "com.instagram.sharedSticker.backgroundImage": imageData,
                "com.instagram.sharedSticker.backgroundTopColor": "#FF5733",
                "com.instagram.sharedSticker.backgroundBottomColor": "#3357FF"
            ]
        ]
        
        let pasteboardOptions: [UIPasteboard.OptionsKey: Any] = [
            .expirationDate: Date().addingTimeInterval(60 * 5)
        ]
        
        UIPasteboard.general.setItems(pasteboardItems, options: pasteboardOptions)
        
        UIApplication.shared.open(instagramURL, options: [:], completionHandler: nil)
    } else {
        // Instagram not installed
        showInstagramNotInstalledAlert()
    }
}

func showInstagramNotInstalledAlert() {
    let alert = UIAlertController(
        title: "Instagram Not Found",
        message: "Please install Instagram to share your results",
        preferredStyle: .alert
    )
    alert.addAction(UIAlertAction(title: "OK", style: .default))
    present(alert, animated: true)
}
```

#### Android Implementation

```kotlin
import android.content.Intent
import android.net.Uri
import androidx.core.content.FileProvider

fun shareToInstagramStory(imageUri: Uri, score: Int) {
    val storiesIntent = Intent("com.instagram.share.ADD_TO_STORY")
    storiesIntent.type = "image/*"
    storiesIntent.putExtra("interactive_asset_uri", imageUri)
    
    // Add background colors
    storiesIntent.putExtra("top_background_color", "#FF5733")
    storiesIntent.putExtra("bottom_background_color", "#3357FF")
    
    // Grant permission
    grantUriPermission(
        "com.instagram.android",
        imageUri,
        Intent.FLAG_GRANT_READ_URI_PERMISSION
    )
    
    if (storiesIntent.resolveActivity(packageManager) != null) {
        startActivityForResult(storiesIntent, INSTAGRAM_STORY_REQUEST_CODE)
    } else {
        // Instagram not installed
        Toast.makeText(this, "Instagram not installed", Toast.LENGTH_SHORT).show()
    }
}

companion object {
    const val INSTAGRAM_STORY_REQUEST_CODE = 1001
}
```

### Option 3: Generate Shareable Link (Universal)

Create a shareable web link that works everywhere:

```javascript
// Backend: Generate unique share link
app.post('/api/share/create', async (req, res) => {
  const { userId, score, level, playerName } = req.body;
  
  const shareId = generateUniqueId();
  
  // Store share data in database
  await db.shares.insert({
    id: shareId,
    userId: userId,
    score: score,
    level: level,
    playerName: playerName,
    createdAt: new Date()
  });
  
  const shareUrl = `https://yourgame.com/share/${shareId}`;
  
  res.json({ shareUrl });
});

// Frontend: Share via native share or clipboard
function shareGameResult(score, level) {
  fetch('/api/share/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ score, level, playerName: 'John' })
  })
  .then(res => res.json())
  .then(data => {
    if (navigator.share) {
      navigator.share({
        title: 'My Game Score',
        text: `I scored ${score} points!`,
        url: data.shareUrl
      });
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(data.shareUrl);
      alert('Link copied to clipboard!');
    }
  });
}
```

---

## Security Best Practices

### 1. Never Expose Secrets in Client Code

```javascript
// ❌ WRONG - Never do this
const APP_SECRET = 'abc123secretkey';

// ✅ CORRECT - Use environment variables server-side
const APP_SECRET = process.env.FB_APP_SECRET;
```

### 2. Always Verify Tokens Server-Side

```javascript
// ✅ Always verify access tokens on your backend
async function verifyToken(accessToken) {
  const response = await fetch(
    `https://graph.facebook.com/debug_token?` +
    `input_token=${accessToken}&` +
    `access_token=${APP_ID}|${APP_SECRET}`
  );
  
  const data = await response.json();
  return data.data.is_valid;
}
```

### 3. Use HTTPS Everywhere

```
// ✅ All OAuth redirects must use HTTPS
Redirect URI: https://yourgame.com/auth/callback

// ❌ HTTP is not allowed
Redirect URI: http://yourgame.com/auth/callback
```

### 4. Implement CSRF Protection

```javascript
// Generate state parameter
function generateState() {
  return Math.random().toString(36).substring(7);
}

// Store state in session
const state = generateState();
sessionStorage.setItem('oauth_state', state);

// Verify state on callback
function verifyCallback(returnedState) {
  const originalState = sessionStorage.getItem('oauth_state');
  return originalState === returnedState;
}
```

### 5. Sanitize User Input

```javascript
// ✅ Always sanitize user data
function sanitizeUserInput(input) {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
```

### 6. Handle Token Expiration

```javascript
// Check token validity before use
async function makeAuthenticatedRequest(accessToken) {
  try {
    const response = await fetch('/api/game-data', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (response.status === 401) {
      // Token expired, refresh or re-login
      await refreshToken();
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
}
```

### 7. Limit Data Collection

```javascript
// ✅ Only request necessary permissions
const permissions = ['public_profile', 'email']; // Minimal set

// ❌ Don't request unnecessary permissions
const permissions = ['public_profile', 'email', 'user_friends', 
                     'user_posts', 'user_photos']; // Too much!
```

---

## Testing

### 1. Create Test Users

In Facebook App Dashboard:
1. Go to **Roles** → **Test Users**
2. Click "Add Test Users"
3. Create 3-5 test users with different scenarios
4. Give them test credentials

### 2. Test Login Flow

**Test Cases:**
- [ ] Successful login
- [ ] Login cancellation
- [ ] Denied permissions
- [ ] Already logged in
- [ ] Logout
- [ ] Token expiration
- [ ] Network errors

### 3. Test Sharing

**Test Cases:**
- [ ] Share to Facebook feed
- [ ] Share to Instagram Stories
- [ ] Share cancellation
- [ ] Instagram app not installed
- [ ] Permission denied for sharing

### 4. Test on Multiple Platforms

- [ ] Web (Chrome, Firefox, Safari)
- [ ] iOS (iPhone, iPad)
- [ ] Android (various devices)
- [ ] Different OS versions

### 5. Testing Checklist

```javascript
// Example test suite
describe('Facebook Authentication', () => {
  
  test('User can login successfully', async () => {
    // Test implementation
  });
  
  test('User data is retrieved correctly', async () => {
    // Test implementation
  });
  
  test('Access token is verified server-side', async () => {
    // Test implementation
  });
  
  test('Invalid token is rejected', async () => {
    // Test implementation
  });
  
  test('User can logout', async () => {
    // Test implementation
  });
});
```

---

## Deployment Checklist

### Pre-Launch

- [ ] Remove all test API keys
- [ ] Configure production environment variables
- [ ] Set up HTTPS/SSL certificate
- [ ] Configure production OAuth redirect URIs
- [ ] Update privacy policy URL
- [ ] Update terms of service URL
- [ ] Configure App Domains correctly
- [ ] Set up error logging (Sentry, Rollbar, etc.)
- [ ] Implement rate limiting
- [ ] Set up monitoring and alerts

### App Review Preparation

If you need posting permissions:

- [ ] Create demo video showing app functionality
- [ ] Write detailed use case description
- [ ] Prepare test credentials for reviewers
- [ ] Document step-by-step testing instructions
- [ ] Verify privacy policy is comprehensive
- [ ] Ensure data deletion callback is implemented
- [ ] Test entire flow end-to-end

### Submit for Review

1. Go to **App Review** → **Permissions and Features**
2. Request permissions you need:
   - `pages_manage_posts`
   - `instagram_content_publish`
3. Fill out review forms:
   - Explain how you use each permission
   - Provide screenshots/video
   - Add detailed notes for reviewers
4. Submit and wait (typically 3-7 business days)

### Post-Launch Monitoring

```javascript
// Implement analytics
function trackSocialLogin(platform, success) {
  analytics.track('Social Login', {
    platform: platform,
    success: success,
    timestamp: new Date()
  });
}

// Monitor errors
window.addEventListener('error', (event) => {
  logError({
    message: event.message,
    source: event.filename,
    line: event.lineno
  });
});
```

### Production Environment Variables

```bash
# .env.production
FB_APP_ID=your_production_app_id
FB_APP_SECRET=your_production_app_secret
FB_CLIENT_TOKEN=your_client_token
REDIRECT_URI=https://yourgame.com/auth/callback
SESSION_SECRET=your_secure_session_secret
DATABASE_URL=your_database_url
```

---

## Common Issues & Troubleshooting

### Issue 1: "App Not Set Up" Error

**Solution:**
- Verify App ID is correct
- Check that domain is added to App Domains
- Ensure Basic Settings are complete

### Issue 2: Redirect URI Mismatch

**Solution:**
- Verify redirect URI exactly matches (including https://)
- Check for trailing slashes
- Update in Facebook Login Settings

### Issue 3: "Invalid Scopes" Error

**Solution:**
- Request only approved permissions
- Submit for App Review if needed
- Check permission spelling

### Issue 4: Instagram Not Opening

**Solution:**
- Verify Instagram app is installed
- Check URL scheme configuration
- Ensure image format is correct (PNG/JPEG)

### Issue 5: Token Expired

**Solution:**
- Implement token refresh logic
- Exchange for long-lived tokens
- Handle 401 errors gracefully

### Issue 6: Share Dialog Not Appearing

**Solution:**
- Check popup blockers
- Verify Facebook SDK is loaded
- Test with FB.ui directly

---

## Additional Resources

### Official Documentation
- Facebook Login: https://developers.facebook.com/docs/facebook-login
- Instagram API: https://developers.facebook.com/docs/instagram-api
- Graph API: https://developers.facebook.com/docs/graph-api
- Sharing: https://developers.facebook.com/docs/sharing

### SDKs
- JavaScript SDK: https://developers.facebook.com/docs/javascript
- iOS SDK: https://developers.facebook.com/docs/ios
- Android SDK: https://developers.facebook.com/docs/android

### Tools
- Graph API Explorer: https://developers.facebook.com/tools/explorer
- Access Token Debugger: https://developers.facebook.com/tools/debug/accesstoken
- Sharing Debugger: https://developers.facebook.com/tools/debug/sharing

### Support
- Developer Community: https://developers.facebook.com/community
- Bug Reports: https://developers.facebook.com/support/bugs
- Platform Updates: https://developers.facebook.com/blog

---

## Quick Reference: API Endpoints

```
# User Profile
GET https://graph.facebook.com/v19.0/me?fields=id,name,email,picture

# Token Debug
GET https://graph.facebook.com/debug_token?input_token={token}&access_token={app_token}

# Exchange Token
GET https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id={app_id}&client_secret={app_secret}&fb_exchange_token={token}

# Post to Feed (requires permission)
POST https://graph.facebook.com/v19.0/me/feed
Body: { message: "...", link: "..." }

# Get User's Pages
GET https://graph.facebook.com/v19.0/me/accounts

# Instagram Account
GET https://graph.facebook.com/v19.0/{page_id}?fields=instagram_business_account
```

---

## Summary

This implementation covers:
✅ Facebook/Instagram Login (same account system)
✅ User profile retrieval (name, email, picture)
✅ Facebook feed sharing (requires review)
✅ Instagram Story sharing (works without review)
✅ Universal shareable links
✅ Multi-platform support (Web, iOS, Android)
✅ Security best practices
✅ Testing strategies
✅ Deployment guidelines

**Next Steps:**
1. Set up your Meta App in Developer Console
2. Choose your platform (Web/iOS/Android)
3. Implement authentication flow
4. Add sharing features
5. Test thoroughly
6. Submit for app review if needed
7. Deploy to production

**Remember:**
- Instagram feed posting is not available via API
- Instagram Stories sharing works via deep linking
- Always verify tokens server-side
- Never expose app secrets in client code
- Start with minimal permissions

Good luck with your game! 🎮
