import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { CreateCompanyDto } from './create-company.dto';

// Same options as the global pipe in main.ts.
const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

const run = (body: unknown) =>
  pipe.transform(body, { type: 'body', metatype: CreateCompanyDto });

const messagesOf = async (body: unknown): Promise<string[]> => {
  try {
    await run(body);
  } catch (e) {
    if (e instanceof BadRequestException) {
      const res = e.getResponse() as { message: string[] };
      return res.message;
    }
    throw e;
  }
  throw new Error('Expected a BadRequestException, but validation passed');
};

const base = { email: 'a@b.test' };

describe('CreateCompanyDto company name', () => {
  it('accepts a valid name', async () => {
    const dto = await run({ ...base, company: 'Acme' });
    expect(dto.company).toBe('Acme');
  });

  it('trims leading and trailing spaces from the stored value', async () => {
    const dto = await run({ ...base, company: '  Acme Corp \t' });
    expect(dto.company).toBe('Acme Corp');
  });

  it('accepts exactly 100 characters', async () => {
    const dto = await run({ ...base, company: 'a'.repeat(100) });
    expect(dto.company).toHaveLength(100);
  });

  it('rejects a name made only of spaces', async () => {
    const messages = await messagesOf({ ...base, company: '   ' });
    expect(messages).toContain('Company is required');
  });

  it('rejects an empty string', async () => {
    const messages = await messagesOf({ ...base, company: '' });
    expect(messages).toContain('Company is required');
  });

  it('rejects a 1 character name', async () => {
    const messages = await messagesOf({ ...base, company: 'a' });
    expect(messages).toContain('Company must be at least 2 characters long');
  });

  it('rejects a name that is 1 character after trimming', async () => {
    const messages = await messagesOf({ ...base, company: '  a  ' });
    expect(messages).toContain('Company must be at least 2 characters long');
  });

  it('rejects 101 characters', async () => {
    const messages = await messagesOf({ ...base, company: 'a'.repeat(101) });
    expect(messages).toContain('Company must not exceed 100 characters');
  });

  it('rejects a missing company key', async () => {
    const messages = await messagesOf({ ...base });
    expect(messages).toContain('Company is required');
  });

  it('rejects a null company', async () => {
    const messages = await messagesOf({ ...base, company: null });
    expect(messages).toContain('Company is required');
  });

  it('rejects a non-string company', async () => {
    const messages = await messagesOf({ ...base, company: 123 });
    expect(messages).toContain('Company must be a string');
  });

  it('keeps the contact name rules unchanged (optional, min 2)', async () => {
    const ok = await run({ ...base, company: 'Acme' });
    expect(ok.name).toBeUndefined();
    const messages = await messagesOf({ ...base, company: 'Acme', name: 'a' });
    expect(messages).toContain('Name must be at least 2 characters long');
  });
});
