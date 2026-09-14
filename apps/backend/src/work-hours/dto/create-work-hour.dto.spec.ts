import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateWorkHourDto } from './create-work-hour.dto';

const validBase = {
  date: '2026-01-01T00:00:00.000Z',
  hours: 1.5,
  clientId: '11111111-1111-1111-1111-111111111111',
};

describe('CreateWorkHourDto', () => {
  it('accepts a valid startTime/endTime pair', async () => {
    const dto = plainToInstance(CreateWorkHourDto, {
      ...validBase,
      startTime: '09:00',
      endTime: '12:30',
    });
    const errors = await validate(dto);

    expect(
      errors.filter((e) => ['startTime', 'endTime'].includes(e.property)),
    ).toHaveLength(0);
  });

  it('accepts a request with neither startTime nor endTime', async () => {
    const dto = plainToInstance(CreateWorkHourDto, { ...validBase });
    const errors = await validate(dto);

    expect(
      errors.filter((e) => ['startTime', 'endTime'].includes(e.property)),
    ).toHaveLength(0);
  });

  it('rejects a startTime/endTime not matching HH:mm', async () => {
    const startErrors = await validate(
      plainToInstance(CreateWorkHourDto, { ...validBase, startTime: '9h' }),
    );
    expect(startErrors.some((e) => e.property === 'startTime')).toBe(true);

    const endErrors = await validate(
      plainToInstance(CreateWorkHourDto, { ...validBase, endTime: '25:00' }),
    );
    expect(endErrors.some((e) => e.property === 'endTime')).toBe(true);
  });
});
