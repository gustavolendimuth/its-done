import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

const ACTION_TOKEN_TTL = '30m';
const ACTION_TOKEN_SCOPE = 'work-session-action';

@Injectable()
export class ActionTokenService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  private getSecret(): string {
    return this.configService.get('JWT_SECRET') || 'your-secret-key';
  }

  issue(sessionId: string, nonce: string): string {
    return this.jwtService.sign(
      { sessionId, nonce, scope: ACTION_TOKEN_SCOPE },
      { secret: this.getSecret(), expiresIn: ACTION_TOKEN_TTL },
    );
  }

  // SPEC_DEVIATION: design.md documents verify() as returning `boolean`,
  // but the nonce check requires reading the session's current promptNonce
  // from the database, so this is necessarily async (Promise<boolean>).
  // Reason: a synchronous signature can't perform the required DB lookup.
  async verify(sessionId: string, token: string): Promise<boolean> {
    let payload: { sessionId?: string; nonce?: string; scope?: string };
    try {
      payload = this.jwtService.verify(token, { secret: this.getSecret() });
    } catch {
      return false;
    }

    if (
      payload.scope !== ACTION_TOKEN_SCOPE ||
      payload.sessionId !== sessionId
    ) {
      return false;
    }

    const session = await this.prisma.workSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.promptNonce !== payload.nonce) {
      return false;
    }

    return true;
  }
}
