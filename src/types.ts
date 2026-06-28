/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Silo {
  id: string;
  name: string;
  feedType: string;
  currentBalance: number; // in kg
  maxCapacity: number; // in kg
  minThreshold: number; // in kg (alert threshold)
}

export type TransactionType = 'consumption' | 'refill' | 'adjustment';

export interface Transaction {
  id: string;
  timestamp: string; // ISO String
  siloId: string;
  siloName: string;
  type: TransactionType;
  quantity: number; // in kg (positive for refill, negative/positive depending on UI, but absolute value here)
  sector: string;
  batch: string;
  operatorName: string;
  operatorId: string;
  notes?: string;
}

export interface OperatorSession {
  operatorName: string;
  operatorId: string;
  sector: string;
  batch: string;
}

export interface OperatorAccount {
  operatorId: string; // Used as the login ID (Matrícula)
  operatorName: string; // Full name of the operator
  password: string; // Plain password for local simulation
  isAdmin?: boolean; // True if the operator is an administrator
}

export interface AdminNotification {
  id: string;
  timestamp: string;
  operatorId: string;
  operatorName: string;
  siloName: string;
  feedType: string;
  type: 'consumption' | 'refill' | 'adjustment';
  quantity: number;
  sector: string;
  batch: string;
  read: boolean;
}
