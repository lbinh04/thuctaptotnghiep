import { useState } from "react";
import { toast } from "react-toastify";
const usePostData = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState(null);

  const postData = async (url, data) => {
    setLoading(true);
    setError(null);

    const token = localStorage.getItem("token"); // Lấy token từ localStorage

    // Show a persistent loading toast and update it when finished
    const toastId = toast.loading("Đang xử lý...");

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      setResponse(result);

      if (!res.ok) {
        toast.update(toastId, {
          render: result?.message || "Đã xảy ra lỗi",
          type: "error",
          isLoading: false,
          autoClose: 4000,
        });
      } else {
        toast.update(toastId, {
          render: "Thanh toán thành công.",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      }

      return result;
    } catch (err) {
      setError(err.message);
      toast.update(toastId, {
        render: err?.message || "Lỗi mạng",
        type: "error",
        isLoading: false,
        autoClose: 4000,
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { postData, loading, error, response };
};

export default usePostData;
