import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { RequireAuth } from "@/components/auth";
import DashboardClient from "./DashboardClient";

export const metadata = {
    title: "Dashboard - Nghề Content",
    description: "Quản lý khóa học và theo dõi tiến độ học tập của bạn",
};

export default function DashboardPage() {
    return (
        <main className="min-h-screen">
            <Header />
            <RequireAuth>
                <DashboardClient />
            </RequireAuth>
            <Footer />
        </main>
    );
}
