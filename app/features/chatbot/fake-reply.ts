import { monthly } from '~/features/dashboard/chart-data';

export const quickQuestions = [
  'Doanh thu 6 tháng thế nào?',
  'Tình hình đơn hàng ra sao?',
  'Khách hàng quay lại có tăng không?',
];

export function getFakeReply(question: string, attachmentNames: string[]) {
  const key = question
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase();
  const format = (value: number) => value.toLocaleString('vi-VN');
  const last = monthly[monthly.length - 1];
  const attachmentNote = attachmentNames.length
    ? `Bạn đã đính kèm: ${attachmentNames.join(', ')}. Đây là bản demo, chatbot chưa đọc hoặc phân tích nội dung tệp.\n\n`
    : '';

  let answer: string;
  if (key.includes('doanh thu') || key.includes('kinh doanh')) {
    const total = monthly.reduce((sum, item) => sum + item.revenue, 0);
    answer = `Theo dữ liệu minh họa tháng 1–6/2026, tổng doanh thu là ${format(total)} triệu đồng. Tháng 6 đạt ${format(last.revenue)} triệu đồng, cao nhất trong 6 tháng.\n\nDoanh thu tăng từ 128 triệu đồng ở tháng 1 lên 268 triệu đồng ở tháng 6; tháng 3 có giảm nhẹ trước khi tăng liên tục từ tháng 4.`;
  } else if (key.includes('don hang')) {
    const total = monthly.reduce((sum, item) => sum + item.orders, 0);
    answer = `Theo dữ liệu minh họa tháng 1–6/2026, có ${format(total)} đơn hàng. Tháng 6 ghi nhận ${format(last.orders)} đơn, cao nhất trong kỳ, so với 320 đơn ở tháng 1.\n\nSố đơn tăng đều từ tháng 4 đến tháng 6, cùng chiều với doanh thu.`;
  } else if (key.includes('khach hang')) {
    answer = `Theo dữ liệu minh họa, khách hàng quay lại tăng từ ${format(monthly[0].returning)} ở tháng 1 lên ${format(last.returning)} ở tháng 6. Chỉ số này tăng qua từng tháng trong kỳ.\n\nBạn có thể xem biểu đồ khách hàng trên Trang chủ để so sánh chi tiết.`;
  } else if (attachmentNames.length && !question.trim()) {
    answer =
      'Bạn có thể gửi thêm câu hỏi về doanh thu, đơn hàng hoặc khách hàng để thử các câu trả lời mẫu.';
  } else {
    answer =
      'Mình là chatbot minh họa và chưa có câu trả lời cho nội dung này. Bạn có thể hỏi về doanh thu, đơn hàng hoặc khách hàng trong 6 tháng đầu năm 2026.';
  }
  return attachmentNote + answer;
}
