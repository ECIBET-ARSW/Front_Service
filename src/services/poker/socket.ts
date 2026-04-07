import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'

const POKER_BASE = import.meta.env.VITE_POKER_URL ?? 'http://localhost:8085'

let stompClient: Client | null = null

export function connectSocket(
  gameId: string,
  playerId: string,
  onGameUpdate: (data: any) => void,
  onPrivateHand?: (data: any) => void
): Promise<Client> {
  return new Promise((resolve, reject) => {
    const socket = new SockJS(`${POKER_BASE}/ws`)

    stompClient = new Client({
      webSocketFactory: () => socket,
      connectHeaders: { login: playerId },
      debug: () => {},
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    })

    stompClient.onConnect = () => {
      stompClient!.subscribe(`/topic/game/${gameId}`, (msg) => {
        if (!msg.body) return
        try { onGameUpdate(JSON.parse(msg.body)) } catch (e) { console.error('Parse error (game):', e) }
      })

      if (onPrivateHand) {
        stompClient!.subscribe('/user/queue/hand', (msg) => {
          if (!msg.body) return
          try { onPrivateHand(JSON.parse(msg.body)) } catch (e) { console.error('Parse error (hand):', e) }
        })
      }

      resolve(stompClient!)
    }

    stompClient.onStompError = (frame) => { reject(frame) }
    stompClient.activate()
  })
}

export function disconnectSocket() {
  if (stompClient) {
    try { stompClient.deactivate() } catch (_) {}
    stompClient = null
  }
}

export function sendPlayerAction(gameId: string, action: string, playerId: string, raiseAmount = 0) {
  if (!stompClient?.active) throw new Error('Socket no conectado')
  stompClient.publish({ destination: `/app/game/${gameId}/action`, body: JSON.stringify({ playerId, action, raiseAmount }) })
}

export function sendDeal(gameId: string) {
  if (!stompClient?.active) throw new Error('Socket no conectado')
  stompClient.publish({ destination: `/app/game/${gameId}/deal`, body: '' })
}

export function sendNextPhase(gameId: string) {
  if (!stompClient?.active) throw new Error('Socket no conectado')
  stompClient.publish({ destination: `/app/game/${gameId}/phase`, body: '' })
}