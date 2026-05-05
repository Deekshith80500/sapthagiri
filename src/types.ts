export type UserRole = 'owner' | 'leader';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  degree?: string;
  address?: string;
}

export interface Worker {
  id: string;
  name: string;
  phone?: string;
  photo?: string;
  role: string;
  address?: string;
  createdBy: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  workerId: string;
  date: string;
  status: 'present' | 'absent';
  capturePhoto?: string;
  markedBy: string;
  updatedAt: string;
}
