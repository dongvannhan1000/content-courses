import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CourseDetailClient from "./CourseDetailClient";

// Mock course data - will be fetched from API
const mockCourseDetail = {
    id: 1,
    title: "Content Marketing từ Zero đến Hero",
    slug: "content-marketing-tu-zero-den-hero",
    shortDesc: "Khóa học toàn diện về Content Marketing, từ cơ bản đến nâng cao.",
    description: `
## Giới thiệu khóa học

Khóa học này được thiết kế để giúp bạn nắm vững toàn bộ kiến thức về Content Marketing, từ những khái niệm cơ bản nhất đến các chiến lược nâng cao được sử dụng bởi các chuyên gia hàng đầu.

### Bạn sẽ học được gì?

- Hiểu rõ về Content Marketing và vai trò trong chiến lược digital marketing
- Xây dựng chiến lược content phù hợp với mục tiêu kinh doanh
- Viết content hấp dẫn, tối ưu SEO
- Tạo content calendar và quản lý workflow hiệu quả
- Đo lường và tối ưu hiệu quả content

### Khóa học phù hợp với ai?

- Người mới bắt đầu muốn tìm hiểu về Content Marketing
- Marketing Executive muốn nâng cao kỹ năng
- Freelancer muốn mở rộng dịch vụ
- Chủ doanh nghiệp nhỏ muốn tự xây dựng content
    `,
    thumbnail: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1200&h=675&fit=crop",
    videoPreview: "https://www.youtube.com/watch?v=example",
    price: 2990000,
    discountPrice: 1990000,
    level: "Beginner",
    duration: 43200,
    status: "PUBLISHED" as const,
    publishedAt: new Date("2024-10-01"),
    instructor: {
        id: 1,
        name: "Nguyễn Văn A",
        photoURL: "https://i.pravatar.cc/150?img=12",
        bio: "Senior Content Strategist với 10 năm kinh nghiệm tại các tập đoàn đa quốc gia. Đã đào tạo hơn 5,000 học viên.",
        title: "Senior Content Strategist",
        company: "ContentPro Agency",
        courseCount: 5,
        studentCount: 5430,
        rating: 4.8,
    },
    category: {
        id: 1,
        name: "Content Marketing",
        slug: "content-marketing",
    },
    lessonCount: 48,
    enrollmentCount: 5430,
    reviewCount: 1250,
    rating: 4.8,
    modules: [
        {
            id: 1,
            title: "Module 1: Giới thiệu Content Marketing",
            lessons: [
                { id: 1, title: "Content Marketing là gì?", duration: 900, type: "VIDEO", isFree: true },
                { id: 2, title: "Tại sao Content Marketing quan trọng?", duration: 720, type: "VIDEO", isFree: true },
                { id: 3, title: "Các loại Content phổ biến", duration: 1200, type: "VIDEO", isFree: false },
                { id: 4, title: "Quiz: Kiểm tra kiến thức cơ bản", duration: 600, type: "QUIZ", isFree: false },
            ],
        },
        {
            id: 2,
            title: "Module 2: Xây dựng chiến lược Content",
            lessons: [
                { id: 5, title: "Xác định mục tiêu content", duration: 1080, type: "VIDEO", isFree: false },
                { id: 6, title: "Nghiên cứu đối tượng mục tiêu", duration: 1500, type: "VIDEO", isFree: false },
                { id: 7, title: "Content Audit - Đánh giá content hiện tại", duration: 1320, type: "VIDEO", isFree: false },
                { id: 8, title: "Bài tập thực hành: Xây dựng Buyer Persona", duration: 1800, type: "ASSIGNMENT", isFree: false },
            ],
        },
        {
            id: 3,
            title: "Module 3: Kỹ năng viết Content",
            lessons: [
                { id: 9, title: "Viết headline thu hút", duration: 1200, type: "VIDEO", isFree: false },
                { id: 10, title: "Cấu trúc bài viết hiệu quả", duration: 1440, type: "VIDEO", isFree: false },
                { id: 11, title: "Storytelling trong Content Marketing", duration: 1680, type: "VIDEO", isFree: false },
                { id: 12, title: "Bài tập: Viết 3 dạng content", duration: 2400, type: "ASSIGNMENT", isFree: false },
            ],
        },
    ],
    reviews: [
        {
            id: 1,
            user: { name: "Trần Minh Tuấn", photoURL: "https://i.pravatar.cc/150?img=32" },
            rating: 5,
            comment: "Khóa học rất chi tiết và dễ hiểu. Giảng viên hướng dẫn rất nhiệt tình. Mình đã áp dụng được ngay vào công việc.",
            createdAt: new Date("2024-11-15"),
        },
        {
            id: 2,
            user: { name: "Lê Thu Hà", photoURL: "https://i.pravatar.cc/150?img=25" },
            rating: 5,
            comment: "Nội dung phong phú, có nhiều ví dụ thực tế. Recommend cho những bạn mới bắt đầu học Content Marketing.",
            createdAt: new Date("2024-11-10"),
        },
        {
            id: 3,
            user: { name: "Phạm Văn Đức", photoURL: "https://i.pravatar.cc/150?img=51" },
            rating: 4,
            comment: "Khóa học hay, nhưng mình mong có thêm phần về Content cho Social Media chi tiết hơn.",
            createdAt: new Date("2024-11-05"),
        },
    ],
    whatYouWillLearn: [
        "Hiểu rõ về Content Marketing và vai trò trong digital marketing",
        "Xây dựng chiến lược content phù hợp với mục tiêu kinh doanh",
        "Viết content hấp dẫn, tối ưu SEO từ cơ bản đến nâng cao",
        "Tạo content calendar và quản lý workflow hiệu quả",
        "Đo lường và tối ưu hiệu quả content bằng các công cụ",
        "Xây dựng đội nhóm và quy trình sản xuất content",
    ],
    requirements: [
        "Không yêu cầu kinh nghiệm trước đó",
        "Có laptop/máy tính để thực hành",
        "Tinh thần học hỏi và sẵn sàng thực hành",
    ],
};

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    // TODO: Fetch course data from API using slug
    const course = mockCourseDetail;

    return (
        <main className="min-h-screen">
            <Header />
            <CourseDetailClient course={course} />
            <Footer />
        </main>
    );
}
