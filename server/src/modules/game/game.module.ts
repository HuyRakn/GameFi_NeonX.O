/**
 * Game Module
 * Handles game-related functionality
 */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { User, UserSchema } from '../../models/user.schema';
import { Game, GameSchema } from '../../models/game.schema';
import { Room, RoomSchema } from '../../models/room.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Game.name, schema: GameSchema },
      { name: Room.name, schema: RoomSchema },
    ]),
  ],
  providers: [GameService, GameGateway],
  exports: [GameService],
})
export class GameModule {}

