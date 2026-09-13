import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateWorkHourDto } from './update-work-hour.dto';

describe('UpdateWorkHourDto', () => {
  it('rejects hours above 24', async () => {
    const dto = plainToInstance(UpdateWorkHourDto, { hours: 30 });
    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'hours')).toBe(true);
  });

  it('rejects hours below 0.1', async () => {
    const dto = plainToInstance(UpdateWorkHourDto, { hours: -1 });
    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'hours')).toBe(true);
  });

  it('rejects hours with more than 2 decimal places', async () => {
    const dto = plainToInstance(UpdateWorkHourDto, { hours: 1.234 });
    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'hours')).toBe(true);
  });

  it('accepts a valid hours value', async () => {
    const dto = plainToInstance(UpdateWorkHourDto, { hours: 1.5 });
    const errors = await validate(dto);

    expect(errors.filter((e) => e.property === 'hours')).toHaveLength(0);
  });

  it('transforms an ISO date string into a Date instance', () => {
    const dto = plainToInstance(UpdateWorkHourDto, {
      date: '2025-01-01T00:00:00.000Z',
    });

    expect(dto.date).toBeInstanceOf(Date);
  });
});
