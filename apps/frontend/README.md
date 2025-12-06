# Content Course Platform

Nền tảng học Content Marketing chuyên nghiệp được xây dựng với Next.js 15, React 19, và Tailwind CSS 3.4.

## ✨ Tính năng

- 🎨 **Thiết kế hiện đại**: Glassmorphism, gradient, và micro-animations
- 📱 **Responsive**: Tối ưu cho mọi thiết bị
- ⚡ **Performance**: Next.js 15 với Turbopack
- 🎯 **UI/UX chuyên nghiệp**: Dựa trên nghiên cứu thiết kế cho nền tảng giáo dục
- ♿ **Accessibility**: Hỗ trợ prefers-reduced-motion và ARIA labels

## 🎨 Màu sắc

- **Primary**: Teal/Turquoise (#0D9488) - Màu chủ đạo cho giáo dục
- **Secondary**: Aqua (#2DD4BF) - Màu phụ
- **Accent**: Orange (#EA580C) - CTA và highlight
- **Background**: Gradient từ Primary-50 đến Accent-50

## 🚀 Bắt đầu

### Cài đặt dependencies

\`\`\`bash
npm install
\`\`\`

### Chạy development server

\`\`\`bash
npm run dev
\`\`\`

Mở [http://localhost:3000](http://localhost:3000) để xem kết quả.

### Build production

\`\`\`bash
npm run build
npm start
\`\`\`

## 📁 Cấu trúc thư mục

\`\`\`
content-course-2/
├── app/
│   ├── layout.tsx          # Root layout với fonts và metadata
│   ├── page.tsx            # Trang chủ
│   └── globals.css         # Global styles
├── components/
│   ├── Header.tsx          # Navigation header
│   ├── Hero.tsx            # Hero section
│   └── CourseCard.tsx      # Course card component
├── types/
│   └── course.ts           # TypeScript interfaces
├── lib/
│   └── mockData.ts         # Mock course data
└── public/                 # Static assets
\`\`\`

## 🎯 Các bước tiếp theo

1. ✅ Xây dựng trang hiển thị khóa học (Hoàn thành)
2. ⏳ Trang chi tiết khóa học
3. ⏳ Giỏ hàng và checkout
4. ⏳ Trang đăng nhập/đăng ký
5. ⏳ Dashboard học viên
6. ⏳ Tích hợp backend (Firebase/Supabase)

## 🛠️ Tech Stack

- **Framework**: Next.js 15.1.0
- **React**: 19.0.0
- **Styling**: Tailwind CSS 3.4.15
- **TypeScript**: 5.7.2
- **Icons**: Lucide React
- **Fonts**: Inter + Poppins (Google Fonts)

## 📝 License

MIT
