import { Metadata } from "next";
import CartClient from "./CartClient";

export const metadata: Metadata = {
    title: "Giỏ hàng | Content Course",
    description: "Xem và quản lý các khóa học trong giỏ hàng của bạn",
};

export default function CartPage() {
    return <CartClient />;
}
