const ARMIES_URL = import.meta.env.VITE_ARMIES_URL ?? 'http://localhost:8094'

export interface CreateLobbyRequest {
  userId: string
  username: string
  lobbyName: string
  betAmount: number
}

export interface JoinLobbyRequest {
  userId: string
  username: string
}

export interface Lobby {
  id: string
  name: string
  hostId: string
  status: 'WAITING' | 'IN_PROGRESS' | 'FINISHED'
  betAmount: number
  pot: number
  playerCount: number
  playerNames: string[]
}

export interface Player {
  userId: string
  username: string
  roundsWon: number
  ready: boolean
  lastKeyPressTime: number | null
}

export interface GameState {
  type: string
  lobbyId: string
  status: 'WAITING' | 'IN_PROGRESS' | 'FINISHED'
  currentRound: number
  players: Player[]
  pot: number
  winnerId: string | null
  message?: string
}

export async function getLobbies(): Promise<Lobby[]> {
  const res = await fetch(`${ARMIES_URL}/api/games/armies/lobbies`)
  if (!res.ok) throw new Error('Error al obtener lobbies')
  return res.json()
}

export async function getLobby(lobbyId: string): Promise<Lobby> {
  const res = await fetch(`${ARMIES_URL}/api/games/armies/lobbies/${lobbyId}`)
  if (!res.ok) throw new Error('Error al obtener lobby')
  return res.json()
}

export async function createLobby(data: CreateLobbyRequest): Promise<Lobby> {
  const res = await fetch(`${ARMIES_URL}/api/games/armies/lobbies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Error al crear lobby')
  return res.json()
}

export async function joinLobby(lobbyId: string, data: JoinLobbyRequest): Promise<Lobby> {
  const res = await fetch(`${ARMIES_URL}/api/games/armies/lobbies/${lobbyId}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Error al unirse al lobby')
  return res.json()
}

export async function startGame(lobbyId: string, userId: string): Promise<void> {
  const res = await fetch(`${ARMIES_URL}/api/games/armies/lobbies/${lobbyId}/start?userId=${userId}`, {
    method: 'POST'
  })
  if (!res.ok) throw new Error('Error al iniciar juego')
}

export async function registerKeyPress(lobbyId: string, userId: string): Promise<void> {
  const res = await fetch(`${ARMIES_URL}/api/games/armies/lobbies/${lobbyId}/keypress?userId=${userId}`, {
    method: 'POST'
  })
  if (!res.ok) throw new Error('Error al registrar tecla')
}

export async function leaveLobby(lobbyId: string, userId: string): Promise<void> {
  const res = await fetch(`${ARMIES_URL}/api/games/armies/lobbies/${lobbyId}/leave?userId=${userId}`, {
    method: 'DELETE'
  })
  if (!res.ok) throw new Error('Error al salir del lobby')
}

export async function getGameState(lobbyId: string): Promise<GameState> {
  const res = await fetch(`${ARMIES_URL}/api/games/armies/lobbies/${lobbyId}/state`)
  if (!res.ok) throw new Error('Error al obtener estado del juego')
  return res.json()
}
