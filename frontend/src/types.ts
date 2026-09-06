export type EventType =
  | 'hackathon'
  | 'workshop'
  | 'competition'
  | 'online_course'
  | 'seminar'
  | 'internship'
  | 'other';

export type Position = 'winner' | 'runner_up' | 'finalist' | 'participant' | 'completion';

export type Mode = 'online' | 'offline';

export interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  isEmailVerified: boolean;
  createdAt?: string;
}

export interface Certificate {
  id: string;
  title: string;
  organizer: string;
  eventType: EventType;
  mode: Mode;
  startDate: string | null;
  endDate: string | null;
  position: Position;
  domainTags: string[];
  credentialUrl: string | null;
  description: string | null;
  notes: string | null;
  fileUrl: string;
  rawFileUrl?: string;
  pdfDownloadUrl?: string;
  fileKind?: 'image' | 'pdf';
  createdAt: string;
  updatedAt?: string;
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  hackathon: 'Hackathon',
  workshop: 'Workshop',
  competition: 'Competition',
  online_course: 'Online course',
  seminar: 'Seminar',
  internship: 'Internship',
  other: 'Other'
};

export const POSITION_LABELS: Record<Position, string> = {
  winner: 'Winner',
  runner_up: 'Runner-up',
  finalist: 'Finalist',
  participant: 'Participant',
  completion: 'Completion'
};
