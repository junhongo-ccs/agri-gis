# Agri Dify Design Plan

## Goal

Make Dify the interpretation layer for the Agri-GIS PoC without turning it into the whole UI.

The map should stay primary. The right rail should stay concise and question-driven. The calculation result should be deterministic and traceable.

## User-Facing Behavior

1. The user selects a field on the map.
2. The right rail shows the selected field name and a chat surface.
3. The user uploads a crop symptom image if needed.
4. The app sends the question, selected field context, image references, and label choice to Dify or the workflow wrapper.
5. Dify replies with a short grounded interpretation, and the code step returns the spray calculation.

## What Dify Should Not Do

- do not invent disease names, severity, or treatment outcomes
- do not assert safety or efficacy beyond the provided label data
- do not perform spray arithmetic in free-form prose
- do not repeat the field card verbatim
- do not rely on hidden world knowledge when the payload is weak

## Data Contract

The frontend sends one structured object named `agri_context`.

It should include:

- schema version
- selected field id and name
- field area in hectares
- crop type
- soil pH if available
- last pesticide date if available
- image evidence note or image reference
- selected pesticide label data when available
- the question text

The proxy or workflow wrapper converts that object to a JSON string before it reaches Dify.

## Dify App Setup

Use a Chat App or workflow entry point with one custom input variable:

- variable name: `agri_context`
- label: `選択中の圃場情報`
- type: long text or paragraph
- required: yes

Recommended system prompt rules:

- answer in Japanese
- use only `agri_context`
- keep answers short
- mention whether a conclusion is based on field attributes, image evidence, label data, or the combination
- state uncertainty when evidence is weak or mixed
- keep arithmetic out of the language model and into the code step

## API Flow

Local development uses a small proxy or workflow bridge.

The frontend posts to:

- `/api/dify/chat`

The proxy or workflow wrapper forwards the request to Dify:

- `POST /v1/chat-messages`

The proxy should keep the API key server-side only.

For Railway, the same route should be served by the Dockerized Node process so the browser only talks to one origin.

## Calculation Flow

The spray calculation must be deterministic.

Use a code step for:

- total spray volume in liters
- pesticide amount in milliliters or liters
- any unit conversion required by the chosen label

Recommended calculation inputs:

- `area_ha`
- `spray_volume_per_10a_l`
- `dilution_ratio`

The code step should return both the result and the intermediate values used.

## Environment Variables

Frontend:

- `VITE_DIFY_CHAT_ENDPOINT`
- `VITE_DIFY_USER_ID`

Proxy or server:

- `DIFY_API_KEY`
- `DIFY_API_BASE_URL`
- `DIFY_APP_PATH`
- `PORT`
- `CORS_ORIGIN`

## Expected Response

The frontend should read:

- `answer`
- `conversation_id`
- `calculation_result`

If those are missing, the UI should fall back to a local grounded reply so the screen still works.

## Implementation Notes

- keep the prompt in a standalone markdown file
- keep the proxy small and explicit
- do not put the Dify API key into the React app
- keep the right rail visually light so the chat remains the focus
- emphasize the calculated spray quantity as a distinct card or summary block

## Next Development Step

After the Dify app is created:

1. publish the app or workflow
2. copy the app API key
3. place it only in the proxy or server environment
4. confirm the right rail answers with the live Dify response
5. confirm the calculation step returns the same numeric result for the same input every time
