"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import Loadingform from "@/components/loading-form";
import { useNotification } from "@/hooks/useNotification";
import { apiCall } from "@/lib/apiUtils";
import { toast } from "react-toastify";
import {
  showSuccessNotification,
  showErrorNotification,
} from "@/components/success-notification";

const formSchema = z.object({
  username: z.string().min(2, "Họ tên phải ít nhất 2 ký tự"),
  email: z.string().email("Email không hợp lệ"),
  phone: z
    .string()
    .min(9, "Số điện thoại phải ít nhất 9 chữ số")
    .regex(/^\d+$/, "Số điện thoại chỉ được chứa chữ số"),
  title: z.string().min(5, "Tiêu đề phải ít nhất 5 ký tự"),
  content: z.string().min(20, "Nội dung phải ít nhất 20 ký tự"),
});

export default function FormContact() {
  const [loading, setLoading] = useState(false);
  const { success, error, info } = useNotification();
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      phone: "",
      title: "",
      content: "",
    },
  });

  // Xử lý submit form
  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Hiển thị thông báo đang đợi xử lí
      const toastId = toast.loading("Đang gửi liên hệ...");

      const result = await apiCall(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
        }/api/auth/send-contact-email`,
        {
          method: "POST",
          body: JSON.stringify({
            hoVaTen: data.username,
            email: data.email,
            sdt: data.phone,
            tieuDe: data.title,
            noiDung: data.content,
          }),
        }
      );

      // Dismiss loading toast và hiển thị success
      toast.dismiss(toastId);
      showSuccessNotification("Gửi liên hệ thành công");
      form.reset();
    } catch (err) {
      showErrorNotification(
        err.message || "Lỗi khi gửi liên hệ. Vui lòng thử lại!"
      );
      console.error("Contact form error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form} className="w-[55%]">
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 rounded-lg">
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg font-semibold text-gray-800">Dang xu ly</p>
          </div>
        </div>
      )}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[17px]">Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="Nhập email"
                  type="email"
                  disabled={loading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-5 justify-between">
          <div className="w-[50%]">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[17px]">Họ và tên</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nhập họ tên"
                      disabled={loading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="w-[50%]">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[17px]">Số điện thoại</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nhập số điện thoại"
                      disabled={loading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[17px]">Tiêu đề</FormLabel>
              <FormControl>
                <Input
                  placeholder="Nhập tiêu đề"
                  disabled={loading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[17px]">Nội dung</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Nhập nội dung"
                  disabled={loading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xl font-semibold"
        >
          {loading ? <Loadingform /> : "Gửi"}
        </Button>
      </form>
    </Form>
  );
}
