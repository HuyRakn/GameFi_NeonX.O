/**
 * Room Schema
 * MongoDB schema for game rooms
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RoomDocument = Room & Document;

@Schema({ timestamps: true })
export class Room {
  @Prop({ type: String, required: true, unique: true })
  roomId: string;

  @Prop({ type: String, required: true })
  mode: string;

  @Prop({ type: Number, required: true })
  boardSize: number;

  @Prop({ type: Number, required: true })
  winCondition: number;

  @Prop({ type: Boolean, default: false })
  infiniteMode: boolean;

  @Prop({ type: [String], default: [] })
  players: string[]; // wallet addresses

  @Prop({ type: Number, default: 0 })
  betAmount: number; // in SOL

  @Prop({ type: String, default: 'WAITING' })
  status: string; // WAITING, ACTIVE, FINISHED

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export const RoomSchema = SchemaFactory.createForClass(Room);

