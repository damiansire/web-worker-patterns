import { buildReply } from './echo.worker.logic';

describe('echo worker logic', () => {
  it('uppercases the text and reports its length', () => {
    expect(buildReply('hola')).toEqual({ text: 'HOLA', length: 4 });
  });

  it('handles empty text', () => {
    expect(buildReply('')).toEqual({ text: '', length: 0 });
  });
});
