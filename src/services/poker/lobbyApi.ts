const POKER_BASE = import.meta.env.VITE_POKER_URL ?? 'http://localhost:8085'
const BASE = `${POKER_BASE}/api/v1`

async function req(method: string, path: string, body?: object) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.message || `Error ${res.status}`)
  return json.data
}

export const createLobby = ({ playerId, playerName, credits = 10000 }: { playerId: string; playerName: string; credits?: number }) =>
  req('POST', '/lobby', { playerId, playerName, credits })

export const getLobbies = () =>
  req('GET', '/lobby')

export const joinLobby = ({ lobbyId, playerId, playerName, credits = 10000 }: { lobbyId: string; playerId: string; playerName: string; credits?: number }) =>
  req('PUT', '/lobby/player', { lobbyId, playerId, playerName, credits })

export const startGame = (lobbyId: string) =>
  req('PUT', `/lobby/${lobbyId}`)

export const leaveLobby = (playerId: string) =>
  req('PUT', '/lobby/player/end', { playerId })

export const endGame = (lobbyId: string, winnerId: string) =>
  req('PUT', '/lobby', { lobbyId, winnerId })