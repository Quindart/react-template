import { describe, expect, it } from 'vitest';
import { getFakeReply } from '~/features/chatbot/fake-reply';

describe('business chatbot demo replies', () => {
  it.each(['Doanh thu 6 tháng thế nào?', 'DOANH THU', 'doanh thu'])(
    'answers revenue questions: %s',
    (question) => {
      expect(getFakeReply(question, [])).toContain('1.116 triệu đồng');
      expect(getFakeReply(question, [])).toContain('268 triệu đồng');
    },
  );

  it('recognizes Vietnamese without accents', () => {
    expect(getFakeReply('don hang', [])).toContain('2.790 đơn hàng');
    expect(getFakeReply('khach hang', [])).toContain('380');
  });

  it('gives guidance for questions outside the demo topics', () => {
    expect(getFakeReply('thời tiết hôm nay', [])).toContain(
      'Bạn có thể hỏi về doanh thu, đơn hàng hoặc khách hàng',
    );
  });

  it('never claims to analyze attached files, even when answering a known topic', () => {
    const answer = getFakeReply('doanh thu', ['report.csv']);
    expect(answer).toContain('chưa đọc hoặc phân tích nội dung tệp');
    expect(answer).toContain('report.csv');
    expect(answer).toContain('1.116 triệu đồng');
  });
});
