// src/components/GameIcon.jsx
export function GameIcon({ game, size = 12 }) {
  if (game === 'pokemon') return <span style={{ fontSize: size + 'px', lineHeight: 1 }}>⚡</span>
  if (game === 'onepiece') return <span style={{ fontSize: size + 'px', lineHeight: 1 }}>☠️</span>
  return null
}
export const GAME_LABEL = { pokemon: 'Pokémon', onepiece: 'One Piece' }
export const GAME_COLOR = { pokemon: '#FBBF24', onepiece: '#EF4444' }
