# Dify Right Rail Contract

## Goal

This project uses the right rail as the conversation surface for Dify.

The map remains the main spatial UI. The right rail receives a structured context object from the selected area and sends it to a Dify-compatible endpoint.

## Frontend Env Vars

- `VITE_DIFY_CHAT_ENDPOINT`
  - optional
  - if unset, the rail stays in local fallback mode
  - recommended value for local dev: `/api/dify/chat`
- `VITE_DIFY_USER_ID`
  - optional
  - default: `qgis-tourism-poc`

## Expected Request Shape

The frontend sends a Dify-compatible blocking chat request to the configured endpoint:

```json
{
  "query": "ユーザーの質問",
  "inputs": {
    "tourism_context": {
      "schema_version": "phase1.v1",
      "selected_area_id": "shinagawa"
    }
  },
  "response_mode": "blocking",
  "user": "qgis-tourism-poc",
  "conversation_id": "optional-existing-id",
  "auto_generate_name": true
}
```

The proxy that sits behind `VITE_DIFY_CHAT_ENDPOINT` should forward this payload to Dify and return the JSON response.

## Local Proxy

For local development, run a tiny proxy with:

- `npm run dify:proxy` from `web/`
- `nvm use` first, so `web/.nvmrc` selects `Node 24.13.1`

The proxy expects:

- `DIFY_API_KEY`
- `DIFY_API_BASE_URL` or the default `https://api.dify.ai`
- `DIFY_APP_PATH` or the default `/v1/chat-messages`

The proxy converts the structured `tourism_context` object into a JSON string before sending it to Dify, because the prompt should treat it as grounded text evidence.

## Railway Deployment

When the app is deployed to Railway, the browser should still talk to a single origin.

That means:

- the Dockerized Node process serves the frontend
- the same process handles `POST /api/dify/chat`
- the Dify API key stays on the server side only

## Expected Response Shape

The UI currently reads:

- `answer`
- `conversation_id`

If those fields are missing, the rail falls back to a local grounded reply so the UI remains usable during development.

## Local Fallback

When no endpoint is configured, the right rail still works as a chat surface.

In that mode it:

- appends the user question to the transcript
- generates a grounded local answer from the selected area summary
- keeps the conversation flow visible before the real Dify backend exists

This means the UI can still be reviewed locally even before Dify credentials are ready.
