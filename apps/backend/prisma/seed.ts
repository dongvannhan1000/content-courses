import {
    PrismaClient,
    Role,
    CourseStatus,
    LessonType,
    MediaType,
    EnrollmentStatus,
    PaymentStatus,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error('DATABASE_URL must be defined in the environment.');
}

// Initialize Pool and Adapter for Prisma 7.x
const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

// ============== HELPER FUNCTIONS ==============

function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start: Date, end: Date): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// ============== CONTENT MARKETING SEED DATA ==============

// Course templates - each will be multiplied by variations
const COURSE_TEMPLATES = [
    {
        title: 'Content Marketing từ Zero đến Hero',
        shortDesc: 'Khóa học toàn diện về Content Marketing, từ cơ bản đến nâng cao. Học cách xây dựng chiến lược nội dung, viết content hấp dẫn.',
        thumbnail: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=450&fit=crop',
        categorySlug: 'content-marketing',
    },
    {
        title: 'SEO Content Writing chuyên nghiệp',
        shortDesc: 'Nắm vững kỹ thuật viết content chuẩn SEO, tăng traffic tự nhiên cho website. Học từ chuyên gia nhiều năm kinh nghiệm.',
        thumbnail: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=800&h=450&fit=crop',
        categorySlug: 'seo',
    },
    {
        title: 'Social Media Content Creator',
        shortDesc: 'Trở thành Content Creator chuyên nghiệp trên các nền tảng mạng xã hội. Học cách tạo nội dung viral.',
        thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=450&fit=crop',
        categorySlug: 'social-media',
    },
    {
        title: 'Video Content Marketing',
        shortDesc: 'Làm chủ video marketing từ ý tưởng, kịch bản, quay dựng đến phân phối. Tối ưu hiệu quả với ngân sách hợp lý.',
        thumbnail: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=800&h=450&fit=crop',
        categorySlug: 'video-marketing',
    },
    {
        title: 'Email Marketing & Automation',
        shortDesc: 'Xây dựng hệ thống email marketing tự động, tăng conversion và giữ chân khách hàng hiệu quả.',
        thumbnail: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&h=450&fit=crop',
        categorySlug: 'email-marketing',
    },
    {
        title: 'Content Strategy & Planning',
        shortDesc: 'Học cách xây dựng chiến lược content dài hạn, lập kế hoạch nội dung, và quản lý content calendar chuyên nghiệp.',
        thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=450&fit=crop',
        categorySlug: 'strategy',
    },
    {
        title: 'Copywriting thuyết phục',
        shortDesc: 'Nghệ thuật viết copy bán hàng, tạo headline hấp dẫn, CTA hiệu quả. Tăng tỷ lệ chuyển đổi cho mọi chiến dịch.',
        thumbnail: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&h=450&fit=crop',
        categorySlug: 'content-writing',
    },
    {
        title: 'TikTok Marketing',
        shortDesc: 'Chinh phục TikTok cho doanh nghiệp. Tạo video trend, xây dựng cộng đồng, và chạy quảng cáo hiệu quả.',
        thumbnail: 'https://images.unsplash.com/photo-1611605698335-8b1569810432?w=800&h=450&fit=crop',
        categorySlug: 'social-media',
    },
    {
        title: 'YouTube SEO và Growth',
        shortDesc: 'Tối ưu kênh YouTube từ A-Z. Nghiên cứu keyword, tối ưu video, tăng subscriber và monetization.',
        thumbnail: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=800&h=450&fit=crop',
        categorySlug: 'video-marketing',
    },
    {
        title: 'Storytelling trong Marketing',
        shortDesc: 'Sức mạnh của câu chuyện trong marketing. Học cách kể chuyện thương hiệu, tạo emotional connection.',
        thumbnail: 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=800&h=450&fit=crop',
        categorySlug: 'strategy',
    },
    {
        title: 'Personal Branding',
        shortDesc: 'Xây dựng thương hiệu cá nhân mạnh mẽ. Định vị bản thân, tạo ảnh hưởng trên mạng xã hội.',
        thumbnail: 'https://images.unsplash.com/photo-1493612276216-ee3925520721?w=800&h=450&fit=crop',
        categorySlug: 'strategy',
    },
    {
        title: 'AI trong Content Marketing',
        shortDesc: 'Ứng dụng AI và ChatGPT trong content marketing. Tăng năng suất, tối ưu workflow sáng tạo nội dung.',
        thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=450&fit=crop',
        categorySlug: 'content-marketing',
    },
];

// Variations to multiply courses
const COURSE_VARIATIONS = [
    { suffix: '', levelIndex: 0 },      // Original - Beginner
    { suffix: ' - Nâng cao', levelIndex: 1 },  // Advanced version - Intermediate
    { suffix: ' - Thực chiến', levelIndex: 2 }, // Practical version - Advanced
];

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

// Content Marketing specific lesson templates
const LESSON_TEMPLATES = [
    'Giới thiệu khóa học',
    'Tổng quan về lĩnh vực',
    'Nghiên cứu đối tượng mục tiêu',
    'Phân tích đối thủ cạnh tranh',
    'Xây dựng buyer persona',
    'Lập kế hoạch content calendar',
    'Nghiên cứu keyword và trends',
    'Viết headline hấp dẫn',
    'Cấu trúc bài viết hiệu quả',
    'Kỹ thuật storytelling',
    'Tối ưu SEO on-page',
    'Sử dụng hình ảnh và media',
    'Call-to-action hiệu quả',
    'A/B testing content',
    'Phân tích metrics và KPIs',
    'Công cụ hỗ trợ sáng tạo',
    'Tối ưu workflow làm việc',
    'Case study thực tế',
    'Dự án thực hành 1',
    'Dự án thực hành 2',
    'Review và feedback',
    'Tổng kết khóa học',
];

// Content Marketing specific review comments
const REVIEW_COMMENTS = [
    'Khóa học rất hay và thực tế! Giảng viên giải thích rõ ràng, dễ hiểu.',
    'Nội dung phong phu, áp dụng được ngay vào công việc. Recommend 100%!',
    'Đáng đồng tiền bỏ ra. Học xong đã tự tin làm content cho công ty.',
    'Giảng viên nhiệt tình, support nhanh. Có cộng đồng học viên hỗ trợ nhau.',
    'Khóa học cập nhật theo trend mới nhất. Video chất lượng cao.',
    'Từ zero giờ đã có thể tự viết content chuẩn SEO. Cảm ơn giảng viên!',
    'Case study thực tế rất bổ ích. Áp dụng ngay được cho dự án.',
    'Perfect course! Learned a lot about content strategy.',
    'Rất hài lòng với khóa học này. Đã recommend cho team marketing.',
    'Nội dung chi tiết, từ cơ bản đến nâng cao. Worth every penny!',
    'Sau khóa học traffic website tăng 200%. Quá tuyệt vời!',
    'Giảng viên chia sẻ nhiều kinh nghiệm thực chiến quý giá.',
];

// Prices range (VND)
const PRICES = [990000, 1290000, 1490000, 1790000, 1990000, 2290000, 2490000, 2790000, 2990000, 3290000];

// Instructor data templates
const INSTRUCTOR_PROFILES = [
    { name: 'Nguyễn Minh Anh', bio: 'Senior Content Strategist với 10 năm kinh nghiệm tại các agency hàng đầu', avatar: 12 },
    { name: 'Trần Thị Bình', bio: 'SEO Expert, đã giúp 100+ doanh nghiệp tăng traffic organic', avatar: 45 },
    { name: 'Lê Hoàng Dũng', bio: 'Social Media Manager, cựu Marketing Lead tại startup unicorn', avatar: 33 },
    { name: 'Phạm Thu Hà', bio: 'Video Marketing Specialist, YouTuber 500K subscribers', avatar: 27 },
    { name: 'Hoàng Văn Khoa', bio: 'Email Marketing Consultant, chuyên gia automation', avatar: 56 },
    { name: 'Đỗ Thanh Lan', bio: 'Content Strategist, tác giả sách về Digital Marketing', avatar: 41 },
];

// ============== MAIN SEED FUNCTION ==============

async function main() {
    console.log('🌱 Starting Content Marketing seed...\n');

    // Clean existing data EXCEPT users (in reverse order of dependencies)
    console.log('🧹 Cleaning existing data (keeping users)...');
    await prisma.progress.deleteMany();
    await prisma.review.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.enrollment.deleteMany();
    await prisma.media.deleteMany();
    await prisma.lesson.deleteMany();
    await prisma.course.deleteMany();
    await prisma.category.deleteMany();
    console.log('✅ Cleaned\n');

    // ============== GET EXISTING USERS ==============
    console.log('👥 Checking existing users...');
    const instructors = await prisma.user.findMany({
        where: { role: Role.INSTRUCTOR },
    });
    const students = await prisma.user.findMany({
        where: { role: Role.USER },
    });

    console.log(`  - ${instructors.length} instructors`);
    console.log(`  - ${students.length} students`);

    if (instructors.length === 0) {
        console.log('\n⚠️  No instructors found! Please register users via Firebase first.');
        console.log('   Required: At least 1 INSTRUCTOR and 1 USER');
        console.log('   Use the auth module to register, then update roles in database.\n');
        console.log('   Example SQL:');
        console.log("   UPDATE users SET role = 'INSTRUCTOR' WHERE email = 'instructor@example.com';");
        console.log('\n❌ Seed aborted. Create users first.\n');
        return;
    }

    // Update instructor profiles with photoURL and bio if missing
    console.log('📝 Updating instructor profiles...');
    for (let i = 0; i < instructors.length; i++) {
        const profile = INSTRUCTOR_PROFILES[i % INSTRUCTOR_PROFILES.length];
        await prisma.user.update({
            where: { id: instructors[i].id },
            data: {
                photoURL: instructors[i].photoURL || `https://i.pravatar.cc/150?img=${profile.avatar}`,
                bio: instructors[i].bio || profile.bio,
                name: instructors[i].name || profile.name,
            },
        });
    }
    console.log('✅ Instructor profiles updated\n');

    // Refresh instructors after update
    const updatedInstructors = await prisma.user.findMany({
        where: { role: Role.INSTRUCTOR },
    });

    console.log('✅ Users ready\n');

    // ============== CATEGORIES ==============
    console.log('📁 Creating Content Marketing categories...');
    const mainCategories = await Promise.all([
        prisma.category.create({
            data: {
                name: 'Content Marketing',
                slug: 'content-marketing',
                description: 'Chiến lược và kỹ thuật content marketing tổng thể',
                icon: 'edit',
                order: 1,
            },
        }),
        prisma.category.create({
            data: {
                name: 'SEO',
                slug: 'seo',
                description: 'Tối ưu hóa công cụ tìm kiếm và content SEO',
                icon: 'search',
                order: 2,
            },
        }),
        prisma.category.create({
            data: {
                name: 'Social Media',
                slug: 'social-media',
                description: 'Marketing trên các nền tảng mạng xã hội',
                icon: 'share',
                order: 3,
            },
        }),
        prisma.category.create({
            data: {
                name: 'Video Marketing',
                slug: 'video-marketing',
                description: 'Sản xuất và marketing video content',
                icon: 'video',
                order: 4,
            },
        }),
        prisma.category.create({
            data: {
                name: 'Email Marketing',
                slug: 'email-marketing',
                description: 'Email marketing và automation',
                icon: 'mail',
                order: 5,
            },
        }),
        prisma.category.create({
            data: {
                name: 'Strategy',
                slug: 'strategy',
                description: 'Chiến lược content và branding',
                icon: 'target',
                order: 6,
            },
        }),
    ]);

    // Subcategories
    const subCategories = await Promise.all([
        prisma.category.create({
            data: { name: 'Content Writing', slug: 'content-writing', parentId: mainCategories[0].id, order: 1 },
        }),
        prisma.category.create({
            data: { name: 'Copywriting', slug: 'copywriting', parentId: mainCategories[0].id, order: 2 },
        }),
        prisma.category.create({
            data: { name: 'On-page SEO', slug: 'on-page-seo', parentId: mainCategories[1].id, order: 1 },
        }),
        prisma.category.create({
            data: { name: 'Link Building', slug: 'link-building', parentId: mainCategories[1].id, order: 2 },
        }),
        prisma.category.create({
            data: { name: 'Facebook Marketing', slug: 'facebook-marketing', parentId: mainCategories[2].id, order: 1 },
        }),
        prisma.category.create({
            data: { name: 'TikTok Marketing', slug: 'tiktok-marketing', parentId: mainCategories[2].id, order: 2 },
        }),
    ]);

    const allCategories = [...mainCategories, ...subCategories];
    const categoryMap = new Map(allCategories.map(c => [c.slug, c.id]));
    console.log(`✅ Created ${allCategories.length} categories\n`);

    // ============== COURSES (36 courses) ==============
    console.log('📚 Creating courses...');
    const courses = [];

    for (const template of COURSE_TEMPLATES) {
        for (const variation of COURSE_VARIATIONS) {
            const title = template.title + variation.suffix;
            const price = randomElement(PRICES);
            const hasDiscount = Math.random() > 0.4; // 60% have discount
            const isPublished = Math.random() > 0.15; // 85% published

            const course = await prisma.course.create({
                data: {
                    title,
                    slug: slugify(title),
                    description: `${template.shortDesc}\n\nTrong khóa học này, bạn sẽ được học các kiến thức và kỹ năng thực tế từ chuyên gia hàng đầu trong ngành. Nội dung được cập nhật liên tục theo xu hướng mới nhất.`,
                    shortDesc: template.shortDesc,
                    thumbnail: template.thumbnail,
                    price,
                    discountPrice: hasDiscount ? Math.floor(price * (0.6 + Math.random() * 0.15)) : null,
                    status: isPublished ? CourseStatus.PUBLISHED : CourseStatus.DRAFT,
                    level: LEVELS[variation.levelIndex],
                    duration: randomInt(28800, 72000), // 8-20 hours in seconds
                    instructorId: randomElement(updatedInstructors).id,
                    categoryId: categoryMap.get(template.categorySlug) || mainCategories[0].id,
                    publishedAt: isPublished ? randomDate(new Date('2024-06-01'), new Date()) : null,
                },
            });
            courses.push(course);
        }
    }
    console.log(`✅ Created ${courses.length} courses\n`);

    // ============== LESSONS ==============
    console.log('📝 Creating lessons...');
    let totalLessons = 0;
    const allLessons = [];

    for (const course of courses) {
        const lessonCount = randomInt(15, 25);
        for (let i = 0; i < lessonCount; i++) {
            const title = i < LESSON_TEMPLATES.length
                ? `${i + 1}. ${LESSON_TEMPLATES[i]}`
                : `${i + 1}. Bài học bổ sung ${i - LESSON_TEMPLATES.length + 1}`;

            const isDocument = Math.random() > 0.85; // 15% documents
            const isFree = i < 2; // First 2 lessons are free

            const lesson = await prisma.lesson.create({
                data: {
                    title,
                    slug: slugify(title.replace(/^\d+\.\s*/, '')),
                    description: `Nội dung bài học: ${title}`,
                    type: isDocument ? LessonType.DOCUMENT : LessonType.VIDEO,
                    content: isDocument ? `# ${title}\n\nNội dung tài liệu bài học...` : null,
                    order: i + 1,
                    duration: isDocument ? 0 : randomInt(300, 1800), // 5-30 minutes in seconds
                    isFree,
                    isPublished: course.status === CourseStatus.PUBLISHED,
                    courseId: course.id,
                },
            });
            allLessons.push(lesson);
            totalLessons++;
        }
    }
    console.log(`✅ Created ${totalLessons} lessons\n`);

    // ============== MEDIA ==============
    console.log('🎥 Creating media...');
    let totalMedia = 0;
    const videoLessons = allLessons.filter((l) => l.type === LessonType.VIDEO);

    for (const lesson of videoLessons) {
        await prisma.media.create({
            data: {
                type: MediaType.VIDEO,
                title: `Video: ${lesson.title}`,
                url: `https://example.bunny.net/videos/${lesson.slug}.mp4`,
                filename: `${lesson.slug}.mp4`,
                mimeType: 'video/mp4',
                duration: lesson.duration,
                lessonId: lesson.id,
            },
        });
        totalMedia++;
    }
    console.log(`✅ Created ${totalMedia} media files\n`);

    // ============== ENROLLMENTS & PAYMENTS ==============
    if (students.length > 0) {
        console.log('📋 Creating enrollments & payments...');
        let totalEnrollments = 0;
        let totalPayments = 0;

        const publishedCourses = courses.filter((c) => c.status === CourseStatus.PUBLISHED);

        for (const student of students) {
            // Each student enrolls in 3-8 random courses
            const enrollCount = Math.min(randomInt(3, 8), publishedCourses.length);
            const enrolledCourses = [...publishedCourses]
                .sort(() => Math.random() - 0.5)
                .slice(0, enrollCount);

            for (const course of enrolledCourses) {
                const enrolledAt = randomDate(new Date('2024-06-01'), new Date());
                const progress = randomInt(0, 100);
                const isCompleted = progress === 100;
                const status = isCompleted
                    ? EnrollmentStatus.COMPLETED
                    : EnrollmentStatus.ACTIVE;

                const enrollment = await prisma.enrollment.create({
                    data: {
                        status,
                        enrolledAt,
                        completedAt: isCompleted ? new Date() : null,
                        progressPercent: progress,
                        userId: student.id,
                        courseId: course.id,
                    },
                });
                totalEnrollments++;

                // Create payment
                const price = course.discountPrice || course.price;
                await prisma.payment.create({
                    data: {
                        amount: price,
                        currency: 'VND',
                        status: PaymentStatus.COMPLETED,
                        method: randomElement(['payos', 'vnpay', 'momo']),
                        transactionId: `TXN-${Date.now()}-${randomInt(1000, 9999)}`,
                        userId: student.id,
                        enrollmentId: enrollment.id,
                        paidAt: enrolledAt,
                    },
                });
                totalPayments++;
            }
        }
        console.log(`✅ Created ${totalEnrollments} enrollments, ${totalPayments} payments\n`);

        // ============== PROGRESS ==============
        console.log('📊 Creating progress records...');
        let totalProgress = 0;

        const enrollments = await prisma.enrollment.findMany({
            include: { course: { include: { lessons: true } } },
        });

        for (const enrollment of enrollments) {
            const lessons = enrollment.course.lessons;
            const completedCount = Math.floor(
                (enrollment.progressPercent / 100) * lessons.length
            );

            for (let i = 0; i < lessons.length; i++) {
                const lesson = lessons[i];
                const isCompleted = i < completedCount;
                const watchedPercent = isCompleted ? 100 : i === completedCount ? randomInt(10, 90) : 0;

                if (watchedPercent > 0) {
                    await prisma.progress.create({
                        data: {
                            isCompleted,
                            watchedSeconds: Math.floor(lesson.duration * (watchedPercent / 100)),
                            lastPosition: isCompleted ? 0 : randomInt(0, lesson.duration),
                            completedAt: isCompleted ? randomDate(enrollment.enrolledAt, new Date()) : null,
                            userId: enrollment.userId,
                            lessonId: lesson.id,
                        },
                    });
                    totalProgress++;
                }
            }
        }
        console.log(`✅ Created ${totalProgress} progress records\n`);

        // ============== REVIEWS ==============
        console.log('⭐ Creating reviews...');
        let totalReviews = 0;

        // Only completed or high-progress enrollments can leave reviews
        const reviewableEnrollments = enrollments.filter((e) => e.progressPercent >= 40);

        for (const enrollment of reviewableEnrollments) {
            // 75% chance to leave a review
            if (Math.random() > 0.25) {
                const rating = randomInt(3, 5); // Mostly positive reviews
                await prisma.review.create({
                    data: {
                        rating,
                        comment: randomElement(REVIEW_COMMENTS),
                        isApproved: Math.random() > 0.05, // 95% approved
                        userId: enrollment.userId,
                        courseId: enrollment.courseId,
                    },
                });
                totalReviews++;
            }
        }
        console.log(`✅ Created ${totalReviews} reviews\n`);
    } else {
        console.log('⏭️  Skipping enrollments/payments/progress/reviews (no students)\n');
    }

    // ============== SUMMARY ==============
    console.log('═══════════════════════════════════════');
    console.log('🎉 Content Marketing Seed completed!');
    console.log('═══════════════════════════════════════');
    console.log('\n📊 Summary:');
    console.log(`  Categories:   ${allCategories.length}`);
    console.log(`  Instructors:  ${updatedInstructors.length} (updated profiles)`);
    console.log(`  Students:     ${students.length} (existing)`);
    console.log(`  Courses:      ${courses.length}`);
    console.log(`  Lessons:      ${totalLessons}`);
    console.log(`  Media:        ${totalMedia}`);
    console.log('═══════════════════════════════════════\n');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
