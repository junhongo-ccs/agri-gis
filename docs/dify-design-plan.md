# Dify Design Plan

## Goal

Make Dify the interpretation layer for the tourism PoC without turning it into the whole UI.

The map should stay primary. The right rail should stay concise and question-driven.

## User-Facing Behavior

1. The user selects an area on the map.
2. The right rail shows only the selected area name and a chat surface.
3. The user asks a question.
4. The app sends the question plus structured area context to Dify.
5. Dify replies with a short grounded interpretation.

## What Dify Should Not Do

- do not invent popularity or safety claims
- do not assert crowd size or family-friendliness unless supported
- do not repeat the map card verbatim
- do not rely on hidden world knowledge when the payload is weak

## Data Contract

The frontend sends one structured object named `tourism_context`.

It should include:

- schema version
- selected area id and name
- comparison area only when the user explicitly asks to compare
- counts
- density values
- a short note
- the question text

The proxy converts that object to a JSON string before it reaches Dify.

## Dify App Setup

Use a Chat App with one custom input variable:

- variable name: `tourism_context`
- label: `選択中のエリア情報`
- type: long text or paragraph
- required: yes

Recommended system prompt rules:

- answer in Japanese
- use only `tourism_context`
- keep answers short
- mention whether a conclusion is based on counts, density, or both
- state uncertainty when evidence is weak or mixed

## API Flow

Local development uses a small proxy.

The frontend posts to:

- `/api/dify/chat`

The proxy forwards to Dify:

- `POST /v1/chat-messages`

The proxy should keep the API key server-side only.

For Railway, the same route should be served by the Dockerized Node process so the browser only talks to one origin.

## Environment Variables

Frontend:

- `VITE_DIFY_CHAT_ENDPOINT`
- `VITE_DIFY_USER_ID`

Proxy:

- `DIFY_API_KEY`
- `DIFY_API_BASE_URL`
- `DIFY_APP_PATH`
- `PORT`
- `CORS_ORIGIN`

## Expected Response

The frontend currently reads:

- `answer`
- `conversation_id`

If those are missing, the UI falls back to a local grounded reply so the screen still works.

## Implementation Notes

- keep the prompt in a standalone markdown file
- keep the proxy small and explicit
- do not put the Dify API key into the React app
- keep the right rail visually light so the chat remains the focus

## Next Development Step

After the Dify app is created:

1. publish the app
2. copy the app API key
3. place it only in the proxy environment
4. confirm the right rail answers with the live Dify response
