import {
    PrismaClient,
    Role,
    CourseStatus,
    LessonType,
    MediaType,
    EnrollmentStatus,
    PaymentStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

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

// ============== SEED DATA TEMPLATES ==============

const COURSE_TITLES = [
    // Web Development
    'React.js Tu Co Ban Den Nang Cao',
    'Vue.js 3: Complete Developer Guide',
    'Angular 17 - Full Course',
    'Next.js 14 - Build Production Apps',
    'TypeScript Mastery',
    'Node.js Backend Development',
    'NestJS Enterprise Backend',
    'Express.js REST API',
    'GraphQL voi Apollo',
    'MongoDB Complete Guide',
    'PostgreSQL cho Developers',
    'Redis Caching Strategies',
    // Mobile
    'React Native cho Beginners',
    'Flutter Complete Course',
    'Swift iOS Development',
    'Kotlin Android Masterclass',
    // Data Science
    'Python cho Data Science',
    'Machine Learning co ban',
    'Deep Learning voi TensorFlow',
    'Data Analysis voi Pandas',
    'SQL cho Data Analyst',
    // DevOps
    'Docker Complete Guide',
    'Kubernetes trong Production',
    'CI/CD voi GitHub Actions',
    'AWS Cloud Practitioner',
    'Terraform Infrastructure',
    // Others
    'Git va GitHub',
    'Linux cho Developers',
    'Clean Code Practices',
    'Design Patterns',
    'System Design Interview',
];

const LESSON_TEMPLATES = [
    'Gioi thieu khoa hoc',
    'Cai dat moi truong',
    'Khoi tao du an',
    'Cau truc thu muc',
    'Cu phap co ban',
    'Variables va Data Types',
    'Functions va Methods',
    'Control Flow',
    'Loops va Iterations',
    'Arrays va Collections',
    'Object-Oriented Programming',
    'Error Handling',
    'Async Programming',
    'API Integration',
    'State Management',
    'Testing Basics',
    'Unit Testing',
    'Integration Testing',
    'Performance Optimization',
    'Security Best Practices',
    'Deployment',
    'CI/CD Setup',
    'Monitoring',
    'Du an thuc hanh 1',
    'Du an thuc hanh 2',
    'Tong ket khoa hoc',
];

const REVIEW_COMMENTS = [
    'Khoa hoc rat hay va de hieu! Giang vien giai thich rat chi tiet.',
    'Noi dung phong phu, practical, ap dung duoc ngay vao du an.',
    'Dang dong tien bo ra, recommend cho moi nguoi.',
    'Tot nhung can them mot so vi du thuc te.',
    'Giang vien nhiet tinh, support nhanh.',
    'Khoa hoc cap nhat theo trend moi nhat.',
    'Video chat luong cao, am thanh ro rang.',
    'Hoc xong la co the di lam duoc luon!',
    'Can them exercises va projects thuc hanh.',
    'Perfect course! 5 stars!',
    'Rat hai long voi khoa hoc nay.',
    'Da hoan thanh va nhan duoc cong viec moi!',
];

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const PRICES = [299000, 399000, 499000, 599000, 699000, 799000, 899000, 999000, 1299000, 1499000];

// ============== MAIN SEED FUNCTION ==============

async function main() {
    console.log('🌱 Starting seed (using existing Firebase users)...\n');

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

    if (students.length === 0) {
        console.log('\n⚠️  No students found! Courses will be created but no enrollments.\n');
    }

    console.log('✅ Users ready\n');

    // ============== CATEGORIES ==============
    console.log('📁 Creating categories...');
    const mainCategories = await Promise.all([
        prisma.category.create({
            data: {
                name: 'Lap trinh Web',
                slug: 'lap-trinh-web',
                description: 'Cac khoa hoc ve phat trien web frontend va backend',
                icon: 'code',
                order: 1,
            },
        }),
        prisma.category.create({
            data: {
                name: 'Lap trinh Mobile',
                slug: 'lap-trinh-mobile',
                description: 'Phat trien ung dung iOS va Android',
                icon: 'smartphone',
                order: 2,
            },
        }),
        prisma.category.create({
            data: {
                name: 'Data Science',
                slug: 'data-science',
                description: 'Machine Learning, AI va phan tich du lieu',
                icon: 'chart-bar',
                order: 3,
            },
        }),
        prisma.category.create({
            data: {
                name: 'DevOps va Cloud',
                slug: 'devops-cloud',
                description: 'CI/CD, Docker, Kubernetes va Cloud',
                icon: 'server',
                order: 4,
            },
        }),
        prisma.category.create({
            data: {
                name: 'Ky nang chung',
                slug: 'ky-nang-chung',
                description: 'Git, Linux, Clean Code va cac ky nang co ban',
                icon: 'book',
                order: 5,
            },
        }),
    ]);

    // Subcategories
    const subCategories = await Promise.all([
        prisma.category.create({
            data: { name: 'Frontend', slug: 'frontend', parentId: mainCategories[0].id, order: 1 },
        }),
        prisma.category.create({
            data: { name: 'Backend', slug: 'backend', parentId: mainCategories[0].id, order: 2 },
        }),
        prisma.category.create({
            data: { name: 'Database', slug: 'database', parentId: mainCategories[0].id, order: 3 },
        }),
        prisma.category.create({
            data: { name: 'iOS', slug: 'ios', parentId: mainCategories[1].id, order: 1 },
        }),
        prisma.category.create({
            data: { name: 'Android', slug: 'android', parentId: mainCategories[1].id, order: 2 },
        }),
        prisma.category.create({
            data: { name: 'Cross-platform', slug: 'cross-platform', parentId: mainCategories[1].id, order: 3 },
        }),
    ]);

    const allCategories = [...mainCategories, ...subCategories];
    console.log(`✅ Created ${allCategories.length} categories\n`);

    // ============== COURSES ==============
    console.log('📚 Creating courses...');
    const courses = [];

    // Simple category assignment based on course index ranges
    const getCategoryForCourse = (index: number): number | null => {
        if (index <= 4) return subCategories[0]?.id || null; // Frontend (0-4)
        if (index <= 8) return subCategories[1]?.id || null; // Backend (5-8)
        if (index <= 11) return subCategories[2]?.id || null; // Database (9-11)
        if (index === 12) return subCategories[5]?.id || null; // Cross-platform - React Native
        if (index <= 14) return subCategories[5]?.id || null; // Cross-platform - Flutter
        if (index === 15) return subCategories[4]?.id || null; // Android - Kotlin
        if (index <= 20) return mainCategories[2]?.id || null; // Data Science (16-20)
        if (index <= 25) return mainCategories[3]?.id || null; // DevOps (21-25)
        return mainCategories[4]?.id || null; // Ky nang chung (26+)
    };

    for (let i = 0; i < COURSE_TITLES.length; i++) {
        const title = COURSE_TITLES[i];
        const price = randomElement(PRICES);
        const hasDiscount = Math.random() > 0.5;
        const isPublished = Math.random() > 0.2; // 80% published

        const categoryId = getCategoryForCourse(i);

        const course = await prisma.course.create({
            data: {
                title,
                slug: slugify(title),
                description: `Khoa hoc ${title} tu co ban den nang cao. Ban se hoc duoc cac kien thuc va ky nang can thiet de lam viec chuyen nghiep. Khoa hoc bao gom nhieu bai tap thuc hanh va du an thuc te.`,
                shortDesc: `Lam chu ${title} voi du an thuc te`,
                thumbnail: `https://picsum.photos/seed/${i}/800/450`,
                price,
                discountPrice: hasDiscount ? Math.floor(price * 0.7) : null,
                status: isPublished ? CourseStatus.PUBLISHED : CourseStatus.DRAFT,
                level: randomElement(LEVELS),
                duration: randomInt(600, 2400), // 10-40 hours
                instructorId: randomElement(instructors).id,
                categoryId,
                publishedAt: isPublished ? randomDate(new Date('2024-01-01'), new Date()) : null,
            },
        });
        courses.push(course);
    }
    console.log(`✅ Created ${courses.length} courses\n`);

    // ============== LESSONS ==============
    console.log('📝 Creating lessons...');
    let totalLessons = 0;
    const allLessons = [];

    for (const course of courses) {
        const lessonCount = randomInt(12, 26); // 12-26 lessons per course
        for (let i = 0; i < lessonCount; i++) {
            const title = i < LESSON_TEMPLATES.length
                ? `${i + 1}. ${LESSON_TEMPLATES[i]}`
                : `${i + 1}. Bai hoc bo sung ${i - LESSON_TEMPLATES.length + 1}`;

            const isDocument = Math.random() > 0.85; // 15% documents
            const isFree = i < 2; // First 2 lessons are free

            const lesson = await prisma.lesson.create({
                data: {
                    title,
                    slug: slugify(title.replace(/^\d+\.\s*/, '')),
                    description: `Noi dung bai hoc: ${title}`,
                    type: isDocument ? LessonType.DOCUMENT : LessonType.VIDEO,
                    content: isDocument ? `# ${title}\n\nNoi dung tai lieu bai hoc...` : null,
                    order: i + 1,
                    duration: isDocument ? 0 : randomInt(10, 60),
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
                duration: (lesson.duration || 15) * 60, // Convert to seconds
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
            // Each student enrolls in 2-5 random courses
            const enrollCount = Math.min(randomInt(2, 5), publishedCourses.length);
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
                            watchedSeconds: Math.floor((lesson.duration || 15) * 60 * (watchedPercent / 100)),
                            lastPosition: isCompleted ? 0 : randomInt(0, (lesson.duration || 15) * 60),
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
        const reviewableEnrollments = enrollments.filter((e) => e.progressPercent >= 50);

        for (const enrollment of reviewableEnrollments) {
            // 70% chance to leave a review
            if (Math.random() > 0.3) {
                const rating = randomInt(3, 5); // Mostly positive reviews
                await prisma.review.create({
                    data: {
                        rating,
                        comment: randomElement(REVIEW_COMMENTS),
                        isApproved: Math.random() > 0.1, // 90% approved
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
    console.log('🎉 Seed completed successfully!');
    console.log('═══════════════════════════════════════');
    console.log('\n📊 Summary:');
    console.log(`  Categories:   ${allCategories.length}`);
    console.log(`  Instructors:  ${instructors.length} (existing)`);
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
    });
