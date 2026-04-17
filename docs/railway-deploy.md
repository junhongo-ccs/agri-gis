# Railway Deploy Guide

## Goal

Deploy the tourism PoC from the GitHub repository to Railway with a single Dockerized service.

## Service Shape

Use one Railway service that:

- builds the React app from `web/`
- serves the built static files
- proxies `POST /api/dify/chat` to Dify

## Repository Connection

1. open Railway
2. create a new project
3. connect the GitHub repository
4. choose the branch you want Railway to deploy
   - usually `master` for the main line
   - or a feature branch for a preview environment
5. let Railway detect the root `Dockerfile`

## Required Variables

Set these in Railway:

- `DIFY_API_KEY`
  - required
  - keep this server-side only
- `DIFY_API_BASE_URL`
  - optional
  - default: `https://api.dify.ai`
- `DIFY_APP_PATH`
  - optional
  - default: `/v1/chat-messages`
- `PORT`
  - optional
  - Railway usually injects this, so the app should respect it if present

## App Behavior

The deployed app should:

- serve the React UI at the service root
- answer chat requests from `/api/dify/chat`
- keep the Dify API key out of the browser

## Verification

After deploy:

1. open the Railway service URL
2. confirm the map loads
3. click one area and confirm the map card appears
4. send one question from the right rail
5. confirm the answer returns without exposing the API key

## Notes

- the frontend should not need a GitHub Pages base path
- the app reads the CSV from `/exports/phase1_areas_summary_counts.csv`
- if Railway is using the same origin for UI and API, `VITE_DIFY_CHAT_ENDPOINT` can stay unset
