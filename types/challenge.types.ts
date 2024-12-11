import { Document } from 'mongoose';

export interface IChallenge {
  title: string;
  description: string;
  isActive: boolean;
  startDate: Date;
  endDate: Date;
}

export interface IChallengeDocument extends IChallenge, Document {}