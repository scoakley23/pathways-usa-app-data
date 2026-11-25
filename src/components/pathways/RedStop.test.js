import { describe, it, expect } from 'vitest';
import { splitStop } from './RedStop';

describe('splitStop', () => {
  it('splits off the headline’s final punctuation', () => {
    expect(splitStop('Lesson done.')).toEqual(['Lesson done', '.']);
    expect(splitStop('Done for today!')).toEqual(['Done for today', '!']);
    expect(splitStop('Congress: done!')).toEqual(['Congress: done', '!']);
    expect(splitStop('完成了。')).toEqual(['完成了', '。']);
    expect(splitStop('انتهى الدرس.')).toEqual(['انتهى الدرس', '.']);
  });
  it('leaves text without an ending mark alone', () => {
    expect(splitStop('Lesson done')).toEqual(['Lesson done', '']);
  });
});
