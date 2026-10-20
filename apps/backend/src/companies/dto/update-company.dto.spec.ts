import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { UpdateCompanyDto } from './update-company.dto';

// Same options as the global pipe in main.ts.
const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

const run = (body: unknown) =>
  pipe.transform(body, { type: 'body', metatype: UpdateCompanyDto });

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

describe('UpdateCompanyDto company name', () => {
  it('accepts a valid name', async () => {
    const dto = await run({ company: 'Acme' });
    expect(dto.company).toBe('Acme');
  });

  it('trims leading and trailing spaces from the stored value', async () => {
    const dto = await run({ company: '  Acme Corp \t' });
    expect(dto.company).toBe('Acme Corp');
  });

  it('accepts exactly 100 characters', async () => {
    const dto = await run({ company: 'a'.repeat(100) });
    expect(dto.company).toHaveLength(100);
  });

  it('allows omitting the key (partial update)', async () => {
    const dto = await run({ phone: '123' });
    expect(dto.company).toBeUndefined();
    expect('company' in dto).toBe(false);
  });

  it('allows an empty body', async () => {
    await expect(run({})).resolves.toBeDefined();
  });

  it('rejects a name made only of spaces', async () => {
    const messages = await messagesOf({ company: '   ' });
    expect(messages).toContain('Company is required');
  });

  it('rejects an empty string', async () => {
    const messages = await messagesOf({ company: '' });
    expect(messages).toContain('Company is required');
  });

  it('rejects a 1 character name', async () => {
    const messages = await messagesOf({ company: 'a' });
    expect(messages).toContain('Company must be at least 2 characters long');
  });

  it('rejects 101 characters', async () => {
    const messages = await messagesOf({ company: 'a'.repeat(101) });
    expect(messages).toContain('Company must not exceed 100 characters');
  });

  it('rejects null (column is NOT NULL)', async () => {
    const messages = await messagesOf({ company: null });
    expect(messages).toContain('Company is required');
  });

  it('rejects a non-string company', async () => {
    const messages = await messagesOf({ company: 123 });
    expect(messages).toContain('Company must be a string');
  });

  it('keeps the other fields optional and unchanged', async () => {
    const dto = await run({ company: 'Acme', hourlyRate: 0, phone: '1' });
    expect(dto.hourlyRate).toBe(0);
    const messages = await messagesOf({ name: 'a' });
    expect(messages).toContain('Name must be at least 2 characters long');
  });
});
