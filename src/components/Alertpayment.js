import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import React from "react";
import { useState } from "react";
import { useEffect } from "react";
import usePostData from "@/hooks/useFetchPostData";
import { Button } from "@/components/ui/button";
import { showSuccessNotification } from "./success-notification";

export function AlertPayment(props) {
  const { open, setOpen, name, url, data } = props;

  const { postData, loading, error, response } = usePostData();
  const [step, setStep] = React.useState(0); // 0 = initial, 1 = confirm fee
  const [fee, setFee] = React.useState(0);

  const handleInitialPay = async () => {
    try {
      const result = await postData(url, data);
      if (result && result.requireConfirmation && result.fee) {
        setFee(result.fee);
        setStep(1);
      } else {
        // success - show notification and close
        if (result && result.message) {
          showSuccessNotification("Mở thẻ thành công");
        }
        setTimeout(() => {
          setOpen(false);
          setStep(0);
        }, 1500);
      }
    } catch (err) {
      // error handled by hook/toast
    }
  };

  const handleConfirmFee = async () => {
    try {
      const confirmUrl = url.includes("?")
        ? `${url}&confirm=true`
        : `${url}?confirm=true`;
      const result = await postData(confirmUrl, data);
      if (result) {
        showSuccessNotification("Mở thẻ thành công");
        setTimeout(() => {
          setOpen(false);
          setStep(0);
        }, 1500);
      }
    } catch (err) {
      // error handled by hook/toast
    }
  };
  return (
    <>
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 rounded-lg">
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg font-semibold text-gray-800">Dang xu ly</p>
          </div>
        </div>
      )}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Bạn chắc chắn muốn thanh toán {name} chớ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Xác nhận thanh toán thành công. Chúng tôi sẽ phản hồi lại cho bạn
              trong thời gian sớm nhất.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setStep(0);
                setOpen(false);
              }}
            >
              Cancel
            </AlertDialogCancel>
            {step === 0 ? (
              <AlertDialogAction
                className={"bg-blue-500"}
                onClick={handleInitialPay}
              >
                {loading ? "Đang xử lý..." : "Thanh Toán"}
              </AlertDialogAction>
            ) : (
              <>
                <div className="mr-4 self-center">
                  Phí cần thanh toán: <strong>{fee} VNĐ</strong>
                </div>
                <AlertDialogAction
                  className={"bg-blue-500"}
                  onClick={handleConfirmFee}
                >
                  {loading ? "Đang xử lý..." : "Xác nhận thanh toán phí"}
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
