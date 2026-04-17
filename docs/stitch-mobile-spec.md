# Stitch Mobile Spec

```text
Create a mobile-first Japanese tourism app UI in Japanese.

Goal:
Users choose a tourism area on a map, read a short summary in a bottom sheet, and then move to a dedicated chat page to ask questions about that area.

Core flow:
Map screen -> bottom sheet details -> chat page -> back to map

Hard constraints:
- Follow the existing Tailwind-based design system
- Reuse the current spacing rhythm, corner radii, borders, shadows, and typography hierarchy
- Do not introduce a new visual language
- Use an 8px spacing grid everywhere
- Optimize for smartphone use and one-handed interaction

Design tokens:
- Spacing grid: 8px
- Page side padding: 16px
- Section spacing: 24px
- Card padding: 16px or 20px
- Large radius: 24px
- Medium radius: 16px
- Small radius: 12px
- Pills / chips: fully rounded
- Border: 1px subtle
- Shadow: soft and low contrast
- Primary button height: 48px

Color system:
- App background: `#e2e8f0`
- Main text: `#0f172a`
- Primary surface: `#ffffff`
- Dark rail / chat panel: `#0f172a` to `#111827`
- Keep the palette calm and editorial
- Use only the existing cyan / emerald / amber / fuchsia family for accents

Tailwind-style color hints:
- Background: `bg-slate-200`
- Main text: `text-slate-900`
- Surface: `bg-white`
- Secondary surface: `bg-slate-50`
- Dark panel: `bg-slate-900` or `bg-slate-950`
- Light border: `border-slate-200`
- Dark border: `border-white/10`
- Cyan accent: `text-cyan-700`, `bg-cyan-500`, `border-cyan-300`
- Emerald accent: `text-emerald-700`, `bg-emerald-500`, `border-emerald-300`
- Amber accent: `text-amber-700`, `bg-amber-400`, `border-amber-300`
- Fuchsia / rose accent: `text-fuchsia-700`, `bg-fuchsia-400`, `border-fuchsia-300`
- Dark chat text: `text-slate-100` / `text-white`
- Muted helper text: `text-slate-400` / `text-slate-300`
- Input on dark panel: `bg-slate-900 border-cyan-300/25 text-white placeholder:text-slate-400`
- Popup shell: `rounded-[22px] bg-slate-900/94 border border-white/10 shadow-[0_24px_80px_rgba(15,23,42,0.40)]`
- User bubble: `bg-cyan-500 text-slate-950`
- Assistant bubble: `bg-white/7 text-slate-100 border border-white/10`

Existing area accent colors:
- Shinagawa: cyan, fill `#67e8f9`, stroke `#06b6d4`
- Oimachi: emerald, fill `#6ee7b7`, stroke `#10b981`
- Shiba Park / Tokyo Tower: amber, fill `#fcd34d`, stroke `#f59e0b`
- Odaiba: fuchsia / rose, fill `#f9a8d4`, stroke `#f43f5e`

Use these current screen strings exactly or as close as possible:
- "地図"
- "1.観光エリアを選ぶ"
- "2.エリアについて聞く"
- "品川・大井町・芝公園・お台場の観光基本データをもとに、AIと会話できます。"
- "大井町"
- "やり取り"
- "Dify接続中"
- "チャットで尋ねる"
- "地図へ戻る"
- "入力例：このエリアはどんな観光体験に向いていますか？"

Assistant copy examples:
- "エリアを選ぶと、GISで見た施設分布や集積傾向をもとに特徴を整理できます。まずはこのエリアの特徴や違いを聞いてみてください。"
- "お台場と芝公園・東京タワーを比較すると、芝公園・東京タワーは面積あたりの施設密度が高く凝縮されているのに対し、お台場はより広い面積にミュージアムなどの施設が点在している傾向が見られます。"
- "芝公園・東京タワーは面積が0.747平方キロメートルとコンパクトですが、レストランの密度が50.87、カフェの密度が21.42と、高い密度で施設が集まっています。"
- "一方でお台場は面積が4.592平方キロメートルと広く、ミュージアムが5件存在し、駅や12件あることから、広い範囲に施設が分散していると考えられます。"

User examples:
- "お台場と芝公園の違いは？"
- "このエリアはどんな観光体験に向いていますか？"

Screen requirements:
- Show exactly 4 tappable polygon areas on the map
- The map is the main visual focus
- Keep map controls minimal and avoid clutter
- Tapping a polygon opens a bottom sheet from the bottom
- The bottom sheet shows the selected area name and a short explanation
- The bottom sheet should feel like an overlay layer, not a full-page replacement
- The bottom sheet must be easy to dismiss
- The chat page is dedicated to the selected area
- Show the selected area name near the top of the chat page
- Keep the message input fixed at the bottom
- Keep the conversation area scrollable
- Include a clear back action labeled "地図へ戻る"
- Returning from chat should restore the original map context
- Use progressive disclosure: map first, summary second, chat third
- Keep the primary CTA visually strong and easy to find
- Prioritize clarity over decoration
- Make the transitions between map, detail, and chat feel natural

Acceptance criteria:
- The UI feels mobile-first
- The UI clearly follows the existing spacing, radius, and component style
- The 8px spacing grid is visible
- The map screen contains 4 tappable polygon areas
- The bottom sheet contains the selected area name, summary, and a strong CTA
- The chat page shows the selected area context and a fixed input area
- The chat page includes a clear "地図へ戻る" action
- The layout is readable on a smartphone
- The design looks like a continuation of the existing app
```
