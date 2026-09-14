import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateSettingsDto } from './create-settings.dto';

describe('CreateSettingsDto - roundingIncrementMinutes', () => {
  it.each([0, 5, 10, 15, 30, 60])(
    'accepts every value in the allowed set (%i)',
    async (roundingIncrementMinutes) => {
      const dto = plainToInstance(CreateSettingsDto, {
        alertHours: 160,
        roundingIncrementMinutes,
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    },
  );

  it('rejects a value outside the allowed set', async () => {
    const dto = plainToInstance(CreateSettingsDto, {
      alertHours: 160,
      roundingIncrementMinutes: 7,
    });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('roundingIncrementMinutes');
  });
});
