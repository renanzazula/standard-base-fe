import type {SplashScreenConfig} from '@core/services/splash';
import {isValidHexColor, toWriteInput, validatePublishWindow} from '../splashForm';

describe('validatePublishWindow', () => {
  const start = '2026-07-10T08:00:00.000Z';
  const end = '2026-07-20T22:00:00.000Z';

  it('requires both dates for non-default splashes', () => {
    expect(validatePublishWindow(null, null, false)).toBe('required');
    expect(validatePublishWindow(start, null, false)).toBe('required');
    expect(validatePublishWindow(null, end, false)).toBe('required');
  });

  it('rejects end before or equal to start', () => {
    expect(validatePublishWindow(end, start, false)).toBe('endBeforeStart');
    expect(validatePublishWindow(start, start, false)).toBe('endBeforeStart');
  });

  it('accepts a valid window', () => {
    expect(validatePublishWindow(start, end, false)).toBeNull();
  });

  it('allows missing dates for the default splash but still checks ordering', () => {
    expect(validatePublishWindow(null, null, true)).toBeNull();
    expect(validatePublishWindow(end, start, true)).toBe('endBeforeStart');
  });
});

describe('isValidHexColor', () => {
  it.each(['', '  ', '#FFFFFF', '#1a1a1c', '#ABC'])('accepts %j', (value) => {
    expect(isValidHexColor(value)).toBe(true);
  });

  it.each(['FFFFFF', '#GGGGGG', '#12345', 'red', '#12'])('rejects %j', (value) => {
    expect(isValidHexColor(value)).toBe(false);
  });
});

describe('toWriteInput', () => {
  const base: SplashScreenConfig = {
    id: 's1',
    title: 'Summer',
    displayLimitPerDay: 1,
    alwaysShowForGuest: true,
    platforms: 'ALL',
    priority: 50,
    isDefault: false,
    enabled: true,
  };

  it('drops the presigned imageUrl when an imageKey exists', () => {
    const input = toWriteInput({
      ...base,
      imageKey: 'splash/abc.png',
      imageUrl: 'https://presigned.example/expires-soon',
    });
    expect(input.imageKey).toBe('splash/abc.png');
    expect(input.imageUrl).toBeUndefined();
  });

  it('keeps a legacy imageUrl when there is no imageKey', () => {
    const input = toWriteInput({...base, imageUrl: 'https://cdn.example/logo.png'});
    expect(input.imageUrl).toBe('https://cdn.example/logo.png');
    expect(input.imageKey).toBeUndefined();
  });
});
