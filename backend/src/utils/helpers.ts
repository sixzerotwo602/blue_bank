import { store } from '../models/store.js';
import type { Socket } from 'socket.io';
import type { Room } from '@blue-banker/shared';

// getRoomId: 플레이어 ID로 방 ID를 조회 (인덱스 기반 O(1))
export function getRoomId(playerId: string): string | null {
  return store.playerToRoom.get(playerId) ?? null;
}

// formatManwon: 금액을 만원 단위로 변환
export function formatManwon(amount: number): string {
  if (amount === 0) return '0원';
  const manwon = amount / 10000;
  if (Number.isInteger(manwon)) {
    return `${manwon.toLocaleString()}만원`;
  } else {
    return `${manwon.toFixed(2).replace(/\.?0+$/, '')}만원`;
  }
}

// 클라이언트 IP 추출 (Cloudflare Tunnel 대응)
export function getClientIp(socket: Socket): string {
  const headers = socket.handshake.headers;
  const cfIp = headers['cf-connecting-ip'];
  const forwarded = headers['x-forwarded-for'];
  const forwardedIp = typeof forwarded === 'string' ? forwarded.split(',')[0] ?? '' : '';
  return (typeof cfIp === 'string' && cfIp) || forwardedIp.trim() || socket.handshake.address;
}

// 방 멤버십 확인
export function isRoomMember(socketId: string, room: Room): boolean {
  return room.players.some(p => p.id === socketId);
}

// 호스트 확인
export function isRoomHost(socketId: string, room: Room): boolean {
  return room.hostId === socketId;
}
