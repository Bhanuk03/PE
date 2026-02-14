import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

export type TicketStatus = 'new' | 'pending' | 'closed';
export type BlockType = 'academic' | 'hostel';
export type SubBlock = 'AB1' | 'AB2';
export type WorkType = 'electrical' | 'plumbing' | 'carpentry';

export interface Ticket {
  id: string;
  userId: string;
  userName: string;
  userRole: 'student' | 'staff';
  blockType: BlockType;
  subBlock?: SubBlock;
  workType: WorkType;
  description: string;
  floorNo: string;
  wing: string;
  status: TicketStatus;
  assignedWorker?: string;
  resolvedPhoto?: string;
  review?: string;
  createdAt: string;
  updatedAt: string;
}

interface TicketContextValue {
  tickets: Ticket[];
  isLoading: boolean;
  addTicket: (ticket: Omit<Ticket, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<Ticket>;
  closeTicket: (ticketId: string, photo: string, review: string) => Promise<void>;
  updateTicketStatus: (ticketId: string, status: TicketStatus) => Promise<void>;
  assignWorker: (ticketId: string, worker: string) => Promise<void>;
  getTicketsByUser: (userId: string) => Ticket[];
  getTicketsByStatus: (status: TicketStatus) => Ticket[];
  refreshTickets: () => Promise<void>;
}

const TicketContext = createContext<TicketContextValue | null>(null);
const TICKETS_KEY = '@campusfix_tickets';

export function TicketProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTickets = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem(TICKETS_KEY);
      if (data) setTickets(JSON.parse(data));
    } catch {}
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const saveTickets = useCallback(async (newTickets: Ticket[]) => {
    setTickets(newTickets);
    await AsyncStorage.setItem(TICKETS_KEY, JSON.stringify(newTickets));
  }, []);

  const addTicket = useCallback(async (data: Omit<Ticket, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const ticket: Ticket = {
      ...data,
      id: Crypto.randomUUID(),
      status: 'new',
      createdAt: now,
      updatedAt: now,
    };
    const updated = [ticket, ...tickets];
    await saveTickets(updated);
    return ticket;
  }, [tickets, saveTickets]);

  const closeTicket = useCallback(async (ticketId: string, photo: string, review: string) => {
    const updated = tickets.map((t) =>
      t.id === ticketId
        ? { ...t, status: 'closed' as TicketStatus, resolvedPhoto: photo, review, updatedAt: new Date().toISOString() }
        : t
    );
    await saveTickets(updated);
  }, [tickets, saveTickets]);

  const updateTicketStatus = useCallback(async (ticketId: string, status: TicketStatus) => {
    const updated = tickets.map((t) =>
      t.id === ticketId ? { ...t, status, updatedAt: new Date().toISOString() } : t
    );
    await saveTickets(updated);
  }, [tickets, saveTickets]);

  const assignWorker = useCallback(async (ticketId: string, worker: string) => {
    const updated = tickets.map((t) =>
      t.id === ticketId
        ? { ...t, assignedWorker: worker, status: 'pending' as TicketStatus, updatedAt: new Date().toISOString() }
        : t
    );
    await saveTickets(updated);
  }, [tickets, saveTickets]);

  const getTicketsByUser = useCallback((userId: string) => {
    return tickets.filter((t) => t.userId === userId);
  }, [tickets]);

  const getTicketsByStatus = useCallback((status: TicketStatus) => {
    return tickets.filter((t) => t.status === status);
  }, [tickets]);

  const value = useMemo(
    () => ({ tickets, isLoading, addTicket, closeTicket, updateTicketStatus, assignWorker, getTicketsByUser, getTicketsByStatus, refreshTickets: loadTickets }),
    [tickets, isLoading, addTicket, closeTicket, updateTicketStatus, assignWorker, getTicketsByUser, getTicketsByStatus, loadTickets]
  );

  return <TicketContext.Provider value={value}>{children}</TicketContext.Provider>;
}

export function useTickets() {
  const ctx = useContext(TicketContext);
  if (!ctx) throw new Error('useTickets must be used within TicketProvider');
  return ctx;
}
