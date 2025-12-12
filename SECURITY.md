# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of Silent Orchestra seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Where to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: **[your-email@example.com]**

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

### What to Include

Please include the following information in your report:

- Type of issue (e.g. buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### What to Expect

- We will acknowledge receipt of your vulnerability report
- We will send you regular updates about our progress
- If we confirm the issue, we will release a patch as soon as possible
- We will credit you in the release notes (unless you prefer to remain anonymous)

## Security Best Practices for Users

When using Silent Orchestra:

1. **Camera Permissions**: Only grant camera access when using the app
2. **Browser Security**: Use updated browsers (Chrome, Firefox, Edge, Safari)
3. **HTTPS**: Always access via HTTPS in production
4. **Data Privacy**: No video/audio is recorded or stored on our servers
5. **Local Processing**: All hand tracking happens client-side in your browser

## Known Security Considerations

### Camera Access
- Silent Orchestra requires camera access for hand tracking
- Video is processed locally using MediaPipe
- No video data is transmitted to external servers
- Camera access can be revoked at any time in browser settings

### Third-Party Dependencies
We regularly update dependencies to patch known vulnerabilities:
- MediaPipe Hands (Google)
- Tone.js (audio synthesis)
- React & Vite (build tools)

Run `npm audit` to check for known vulnerabilities in dependencies.

## Responsible Disclosure

We kindly ask that you:
- Give us a reasonable amount of time to fix the issue before public disclosure
- Make a good faith effort to avoid privacy violations and disruption to our users
- Do not access or modify user data without permission

Thank you for helping keep Silent Orchestra and our users safe!
