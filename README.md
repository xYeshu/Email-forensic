# Email Forensic Analyser

A fully client-side, zero-backend web application for professional SOC analysts to perform forensic investigation and phishing analysis of `.eml` email files.

## Features
- **100% Client-Side:** All parsing and analysis happens entirely in the browser. No emails are ever sent to a server.
- **Deep Header Analysis:** Extracts and analyzes complex headers, authentication results (SPF/DKIM/DMARC), and flags anomalies.
- **Advanced IOC Extraction:** Automatically extracts and categorizes URLs, Domains, IPs, Email Addresses, and Hashes.
- **Attachment Triage:** Identifies attachments, calculates SHA256 hashes, and flags potentially dangerous file types.
- **Timeline Visualization:** Provides a hop-by-hop visualization of the email's transit path based on `Received` headers.
- **AI-Powered Investigation:** Integrates with Gemini API to provide a professional SOC analyst summary, identifying phishing tactics and recommending remediation actions.
- **Cybersecurity Dark Theme:** Designed for modern SOC environments with a professional dark theme and responsive layout.

## Tech Stack
- **Framework:** React + TypeScript + Vite
- **Styling:** Tailwind CSS v4
- **Parsing:** postal-mime
- **Icons:** lucide-react
- **AI Analysis:** @google/generative-ai

## Getting Started

### Local Development
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### Setup AI Analysis
To use the AI Analysis features:
1. Get a free API key from Google AI Studio (Gemini).
2. Open the application.
3. Click the Settings icon (⚙️) in the top right.
4. Enter your Gemini API Key. It will be securely stored in your browser's `localStorage`.

## Deployment

This application is ready to be deployed for free on Vercel or Cloudflare Pages.

### Deploy to Vercel
1. Push your code to a GitHub repository.
2. Go to [Vercel](https://vercel.com) and import the repository.
3. Vercel will automatically detect that it's a Vite application.
4. Leave the default build settings:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Click Deploy!

### Deploy to Cloudflare Pages
1. Push your code to a GitHub repository.
2. Go to Cloudflare Dashboard -> Pages.
3. Connect your repository.
4. Set build settings:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Click Save and Deploy!

## Privacy & Security
This application is strictly client-side. The `.eml` files you upload are parsed locally in your browser memory. Data is only sent externally when you explicitly click "Run AI Analysis" (sent to Google's Gemini API).

## License
MIT License
