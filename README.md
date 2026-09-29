<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/772f7b86-f2c6-4c28-bbd9-21477526c226

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to Netlify

This project is pre-configured with:
- `netlify.toml` for automated build and publish settings
- `public/_redirects` and SPA rewrites (`/* -> /index.html 200`)
- Netlify Serverless Functions under `netlify/functions/`:
  - `scan.ts`: Deal scanning with Google Search grounding
  - `assistant.ts`: AI smart shopping advisor
  - `stores.ts`: Google Maps local store finder
  - `health.ts`: Uptime and health check probe

### Deployment Steps:
1. Connect your repository to Netlify (or drag & drop the repo folder in Netlify Drop).
2. Set the build settings (already defined in `netlify.toml`):
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Functions directory:** `netlify/functions`
3. Add your Environment Variable in Netlify (**Site settings > Environment variables**):
   - `GEMINI_API_KEY`: Your Google Gemini API Key
4. Click **Deploy Site**!

