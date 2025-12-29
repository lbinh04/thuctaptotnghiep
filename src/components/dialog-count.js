"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { FaHandPointDown, FaMoneyBillWave, FaWallet } from "react-icons/fa";
import jwt from "jsonwebtoken";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import formatMoney from "./format-money";
import {
  showSuccessNotification,
  showErrorNotification,
  showReminderNotification,
} from "./success-notification";

export default function DialogCount(props) {
  const [count, setCount] = useState(1); // Bắt đầu từ 1
  const [total, setTotal] = useState(props.price || 0); // Tính sẵn total ban đầu
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [loading, setLoading] = useState(false);
  const { open, setOpen, name, postUrl, price, point, id } = props;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      soLuong: 1,
      paymentMethod: "cash",
    },
  });

  const onClose = () => {
    setOpen(false);
    setCount(1); // Reset về 1
    setTotal(price); // Reset total
    setLoading(false);
    reset();
  };

  // Reset form khi dialog mở
  useEffect(() => {
    if (open) {
      setCount(1);
      setTotal(price);
      setPaymentMethod("cash");
      setLoading(false);
      reset({
        soLuong: 1,
        paymentMethod: "cash",
      });
    }
  }, [open, price, reset]);

  const getUserId = () => {
    const token = localStorage.getItem("token");
    const decoded = jwt.decode(token);
    return decoded?.id ?? "";
  };

  // ✅ Thanh toán tiền mặt
  const handlePaymentCash = async (data, toastId = null) => {
    try {
      if (!count || count <= 0) {
        showErrorNotification("Vui lòng nhập số lượng > 0");
        if (toastId) toast.dismiss(toastId);
        return;
      }

      let token = localStorage.getItem("token");
      if (!token) {
        showErrorNotification("Bạn cần đăng nhập lại");
        if (toastId) toast.dismiss(toastId);
        return;
      }

      // Nếu token không có prefix "Bearer", thêm vào
      if (!token.startsWith("Bearer ")) {
        token = "Bearer " + token;
      }

      setLoading(true);
      const localToastId = toastId || toast.loading("Đang xử lý...");

      console.log("📤 Payment Request:", {
        postUrl,
        count,
        soLuong: parseInt(count),
      });

      const response = await fetch(postUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          soLuong: parseInt(count),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("❌ Payment error:", response.status, result);
        toast.update(localToastId, {
          render: result?.message || `Lỗi thanh toán (${response.status})`,
          type: "error",
          isLoading: false,
          autoClose: 4000,
        });
        setLoading(false);
        return;
      }

      toast.dismiss(localToastId);
      showSuccessNotification("Thanh toán thành công");
      setTimeout(() => {
        onClose();
        setLoading(false);
      }, 1200);
    } catch (error) {
      console.error("❌ Lỗi thanh toán:", error);
      showErrorNotification("Lỗi kết nối: " + error.message);
      setLoading(false);
    }
  };

  // ✅ Thanh toán MoMo - Simplified (no redirect)
  const handlePaymentMomo = async (data, toastId = null) => {
    try {
      if (!count || count <= 0) {
        showErrorNotification("Vui lòng nhập số lượng > 0");
        if (toastId) toast.dismiss(toastId);
        return;
      }

      if (!total || total <= 0) {
        showErrorNotification("Số tiền thanh toán không hợp lệ");
        if (toastId) toast.dismiss(toastId);
        return;
      }

      // ✅ Validate MoMo inputs
      const momoPhone = document.getElementById("momo-phone")?.value?.trim();
      const momoPin = document.getElementById("momo-pin")?.value?.trim();

      if (!momoPhone) {
        showReminderNotification("Vui lòng nhập số điện thoại MoMo");
        if (toastId) toast.dismiss(toastId);
        return;
      }

      if (!/^0\d{9}$/.test(momoPhone)) {
        showReminderNotification(
          "Số điện thoại không hợp lệ (phải có 10 chữ số, bắt đầu từ 0)"
        );
        if (toastId) toast.dismiss(toastId);
        return;
      }

      if (!momoPin) {
        showReminderNotification("Vui lòng nhập PIN/Mật khẩu MoMo");
        if (toastId) toast.dismiss(toastId);
        return;
      }

      if (momoPin.length < 4) {
        showReminderNotification("PIN phải có ít nhất 4 chữ số");
        if (toastId) toast.dismiss(toastId);
        return;
      }

      setLoading(true);
      const localToastId = toastId || toast.loading("Đang xử lý...");

      let token = localStorage.getItem("token");
      if (!token) {
        toast.update(localToastId, {
          render: "Bạn cần đăng nhập lại",
          type: "error",
          isLoading: false,
          autoClose: 4000,
        });
        setLoading(false);
        return;
      }

      // Nếu token không có prefix "Bearer", thêm vào
      if (!token.startsWith("Bearer ")) {
        token = "Bearer " + token;
      }

      // Validate token format (JWT có 3 phần: header.payload.signature)
      const jwtParts = token.split(".");
      if (jwtParts.length < 2) {
        toast.update(localToastId, {
          render: "Token không hợp lệ. Vui lòng đăng nhập lại.",
          type: "error",
          isLoading: false,
          autoClose: 4000,
        });
        setLoading(false);
        return;
      }

      const response = await fetch(postUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          soLuong: parseInt(count),
          paymentMethod: "momo",
          momoPhone: momoPhone,
        }),
      });

      let result;
      try {
        result = await response.json();
      } catch (e) {
        console.error("❌ Failed to parse response:", e);
        toast.update(toastId, {
          render: "Lỗi phản hồi từ server",
          type: "error",
          isLoading: false,
          autoClose: 4000,
        });
        setLoading(false);
        return;
      }

      if (!response.ok) {
        toast.update(toastId, {
          render: result.message || `Lỗi: ${response.status}`,
          type: "error",
          isLoading: false,
          autoClose: 4000,
        });
        setLoading(false);
        return;
      }

      toast.dismiss(toastId);
      showSuccessNotification("Thanh toán thành công");

      setTimeout(() => {
        onClose();
        setLoading(false);
      }, 1200);
    } catch (error) {
      console.error("❌ Lỗi thanh toán MoMo:", error);
      showErrorNotification("Lỗi kết nối: " + error.message);
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    // Detect nếu là ticket payment hay point loading
    const isTicketPayment = postUrl.includes("payment-ticket");
    const isPointLoading = postUrl.includes("update-points");

    // Check if user has opened a card before buying ticket
    if (isTicketPayment) {
      try {
        // ✅ Hiển thị loading notification
        const toastId = toast.loading("Đang xử lý thanh toán...");
        await handlePaymentCash(data, toastId);
      } catch (err) {
        console.error(err);
        showErrorNotification("Lỗi xử lý thanh toán");
      }
    } else if (isPointLoading) {
      // Point loading - có cả tiền mặt và MoMo
      const toastId = toast.loading("Đang xử lý...");
      if (paymentMethod === "momo") {
        await handlePaymentMomo(data, toastId);
      } else {
        await handlePaymentCash(data, toastId);
      }
    } else {
      // Default fallback
      const toastId = toast.loading("Đang xử lý...");
      if (paymentMethod === "momo") {
        await handlePaymentMomo(data, toastId);
      } else {
        await handlePaymentCash(data, toastId);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Xác Nhận Mua</DialogTitle>
          <DialogDescription>
            Bạn muốn mua <strong>{name}</strong> với số lượng bao nhiêu? (Tối
            thiểu: 1)
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-4 py-4 overflow-y-auto flex-1 pr-4"
        >
          {/* Số lượng */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="soLuong" className="text-right">
              Số lượng <span className="text-red-500">*</span>
            </Label>
            <div className="col-span-3 space-y-1">
              <Input
                type="number"
                placeholder="Nhập số lượng (tối thiểu 1)"
                min={1}
                value={count}
                id="soLuong"
                {...register("soLuong", {
                  required: "Vui lòng nhập số lượng",
                  min: { value: 1, message: "Số lượng phải lớn hơn 0" },
                  valueAsNumber: true,
                })}
                className="col-span-3"
                onChange={(e) => {
                  const value = Number.parseInt(e.target.value || "0");
                  setValue("soLuong", value);
                  setCount(value);
                  setTotal(value * price);
                }}
              />
              {errors.soLuong && (
                <p className="text-red-500 text-xs">{errors.soLuong.message}</p>
              )}
            </div>
          </div>

          {/* Phương thức thanh toán */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Phương thức thanh toán
            </Label>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(value) => {
                setPaymentMethod(value);
                setValue("paymentMethod", value);
              }}
              className="grid grid-cols-1 gap-3"
            >
              {/* Thanh toán tiền mặt */}
              <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <RadioGroupItem value="cash" id="cash" />
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <FaMoneyBillWave className="text-green-600 text-sm" />
                  </div>
                  <div className="flex-1">
                    <Label
                      htmlFor="cash"
                      className="font-medium cursor-pointer"
                    >
                      Thanh toán tiền mặt
                    </Label>
                    <p className="text-sm text-gray-500">
                      Thanh toán trực tiếp tại trạm
                    </p>
                  </div>
                </div>
              </div>

              {/* Thanh toán MoMo - Chỉ hiện nếu là point loading */}
              {postUrl.includes("update-points") && (
                <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <RadioGroupItem value="momo" id="momo" />
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                      <FaWallet className="text-pink-600 text-sm" />
                    </div>
                    <div className="flex-1">
                      <Label
                        htmlFor="momo"
                        className="font-medium cursor-pointer"
                      >
                        Thanh toán MoMo
                      </Label>
                      <p className="text-sm text-gray-500">
                        Thanh toán qua ví điện tử MoMo
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </RadioGroup>
          </div>

          {/* Hiển thị tổng tiền và điểm */}
          {point && count > 0 && (
            <div className="space-y-3">
              <FaHandPointDown className="mx-auto text-xl animate-bounce text-blue-500" />

              <div
                className={`rounded-lg p-4 space-y-2 ${
                  paymentMethod === "momo"
                    ? "bg-pink-50 border-2 border-pink-200"
                    : "bg-gray-50"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Số điểm nhận được:
                  </span>
                  <strong className="text-blue-600">
                    {formatMoney(point * count)} điểm
                  </strong>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tổng tiền:</span>
                  <strong
                    className={`text-lg font-bold ${
                      paymentMethod === "momo"
                        ? "text-pink-600"
                        : "text-green-600"
                    }`}
                  >
                    {formatMoney(count * price)} đ
                  </strong>
                </div>

                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-gray-600">Phương thức:</span>
                  <div className="flex items-center space-x-2">
                    {paymentMethod === "momo" ? (
                      <>
                        <FaWallet className="text-pink-600 text-base" />
                        <span className="text-sm font-medium text-pink-600">
                          MoMo Wallet
                        </span>
                      </>
                    ) : (
                      <>
                        <FaMoneyBillWave className="text-green-600 text-base" />
                        <span className="text-sm font-medium">Tiền mặt</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Form MoMo PIN - Chỉ hiện nếu là point loading và chọn MoMo */}
                {postUrl.includes("update-points") &&
                  paymentMethod === "momo" && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <p className="text-sm font-semibold text-pink-700">
                        💳 Nhập thông tin MoMo:
                      </p>
                      <div>
                        <label className="text-xs text-gray-600">
                          Số điện thoại MoMo
                        </label>
                        <Input
                          type="tel"
                          placeholder="0912345678"
                          className="mt-1"
                          id="momo-phone"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">
                          PIN/Mật khẩu MoMo
                        </label>
                        <Input
                          type="password"
                          placeholder="••••••"
                          className="mt-1"
                          id="momo-pin"
                        />
                      </div>
                      <div className="bg-pink-100 border-l-4 border-pink-600 p-2 rounded">
                        <p className="text-xs text-pink-700">
                          ℹ️ Sẽ được chuyển hướng đến ứng dụng MoMo để xác thực
                          thanh toán
                        </p>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="mr-2"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Vui lòng chờ...</span>
                </div>
              ) : postUrl.includes("payment-ticket") ? (
                "Mua vé"
              ) : postUrl.includes("update-points") ? (
                paymentMethod === "momo" ? (
                  "Nạp điểm qua MoMo"
                ) : (
                  "Nạp điểm"
                )
              ) : (
                "Xác nhận"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
