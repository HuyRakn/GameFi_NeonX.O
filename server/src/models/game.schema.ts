/**
 * Game Schema
 * MongoDB schema for game history
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GameDocument = Game & Document;

@Schema({ timestamps: true })
export class Game {
  @Prop({ type: String, required: true })
  roomId: string;

  @Prop({ type: String, required: true })
  playerX: string; // wallet address

  @Prop({ type: String, required: true })
  playerO: string; // wallet address

  @Prop({ type: String, required: true })
  mode: string;

  @Prop({ type: Number, required: true })
  boardSize: number;

  @Prop({ type: Number, required: true })
  winCondition: number;

  @Prop({ type: Boolean, default: false })
  infiniteMode: boolean;

  @Prop({ type: Array, default: [] })
  moves: Array<{ row: number; col: number; player: string; timestamp: number }>;

  @Prop({ type: String, default: null })
  winner: string | null; // 'X', 'O', or 'DRAW'

  @Prop({ type: Number, default: 0 })
  betAmount: number; // in SOL

  @Prop({ type: Number, default: 0 })
  prizeAmount: number; // in SOL

  @Prop({ type: String, default: 'ACTIVE' })
  status: string; // ACTIVE, FINISHED, CANCELLED

  @Prop({ type: Date, default: Date.now })
  startedAt: Date;

  @Prop({ type: Date, default: null })
  finishedAt: Date | null;
}

export const GameSchema = SchemaFactory.createForClass(Game);

