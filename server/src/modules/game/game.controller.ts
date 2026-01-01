/**
 * Game Controller
 * HTTP endpoints for game-related operations
 */

import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { EscrowService } from './escrow.service';

@Controller('game')
export class GameController {
  constructor(private readonly escrowService: EscrowService) {}

  /**
   * Verify payment transaction
   * @param body - Payment verification data
   * @returns Verification result
   */
  @Post('verify-payment')
  async verifyPayment(@Body() body: {
    signature: string;
    transactionType: string;
    amount: number;
    publicKey: string;
    mode?: string;
  }) {
    try {
      const { signature, publicKey, mode } = body;

      if (!mode) {
        return { verified: false, error: 'Game mode is required' };
      }

      const verification = await this.escrowService.verifyPayment(
        signature,
        publicKey,
        mode
      );

      if (!verification.valid) {
        return {
          verified: false,
          error: verification.error || 'Payment verification failed',
        };
      }

      return {
        verified: true,
        signature,
        amount: verification.amount,
      };
    } catch (error: any) {
      return {
        verified: false,
        error: error.message || 'Payment verification error',
      };
    }
  }
}

