/**
 * User Schema
 * MongoDB schema for user profiles
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ type: String, required: true, unique: true })
  walletAddress: string;

  @Prop({ type: Number, default: 0 })
  elo: number;

  @Prop({ type: Number, default: 0 })
  totalGames: number;

  @Prop({ type: Number, default: 0 })
  wins: number;

  @Prop({ type: Number, default: 0 })
  losses: number;

  @Prop({ type: Number, default: 0 })
  draws: number;

  @Prop({ type: Number, default: 0 })
  totalWinnings: number; // in SOL

  @Prop({ type: Number, default: 0 })
  totalSpent: number; // in SOL

  @Prop({ type: Date, default: Date.now })
  lastActive: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

