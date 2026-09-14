import { JwtService } from '@nestjs/jwt';
import { ActionTokenService } from './action-token.service';

const SECRET = 'test-jwt-secret';

const configMock = {
  get: jest.fn().mockReturnValue(SECRET),
} as any;

const prismaMock = {
  workSession: {
    findUnique: jest.fn(),
  },
} as any;

describe('ActionTokenService', () => {
  let jwtService: JwtService;
  let service: ActionTokenService;
  const sessionId = 'session-1';
  const nonce = 'nonce-1';

  beforeEach(() => {
    jest.resetAllMocks();
    configMock.get.mockReturnValue(SECRET);
    jwtService = new JwtService({});
    service = new ActionTokenService(jwtService, configMock, prismaMock);
  });

  it('verifies true for a valid token matching sessionId and the current promptNonce', async () => {
    const token = service.issue(sessionId, nonce);
    prismaMock.workSession.findUnique.mockResolvedValueOnce({
      id: sessionId,
      promptNonce: nonce,
    });

    const result = await service.verify(sessionId, token);

    expect(result).toBe(true);
  });

  it('verifies false for an expired token', async () => {
    const expiredToken = jwtService.sign(
      { sessionId, nonce, scope: 'work-session-action' },
      { secret: SECRET, expiresIn: -10 },
    );

    const result = await service.verify(sessionId, expiredToken);

    expect(result).toBe(false);
    expect(prismaMock.workSession.findUnique).not.toHaveBeenCalled();
  });

  it('verifies false when the token was issued for a different sessionId', async () => {
    const token = service.issue('other-session', nonce);

    const result = await service.verify(sessionId, token);

    expect(result).toBe(false);
    expect(prismaMock.workSession.findUnique).not.toHaveBeenCalled();
  });

  it('verifies false when the nonce is stale (already rotated)', async () => {
    const token = service.issue(sessionId, nonce);
    prismaMock.workSession.findUnique.mockResolvedValueOnce({
      id: sessionId,
      promptNonce: 'a-newer-nonce',
    });

    const result = await service.verify(sessionId, token);

    expect(result).toBe(false);
  });
});
