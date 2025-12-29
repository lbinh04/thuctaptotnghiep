import React from "react";
import Image from "next/image";
import Link from "next/link";
import FormRegister from "./form-register";

const Rentbike = () => {
  return (
    <>
      <div>
        <div className="min-h-[400px] relative  bg-black">
          <Image
            src={"https://tngo.vn/image/banner-rank.png"}
            alt="ảnh"
            fill
            className="opacity-50"
            style={{ objectFit: "cover" }}
          />
          <div className="absolute top-1/2 left-1/2 text-center -translate-x-1/2 -translate-y-1/2">
            <h2 className="text-4xl text-white font-bold  ">Thuê xe sự kiện</h2>
          </div>
        </div>
        <div className="w-[1320px] mx-auto">
          <div className="mt-10 py-12 flex">
            <div className="w-[50%] px-12 text-justify text-xl">
              <p className=" mb-5">
                Thuê xe sự kiện là hình thức cho thuê xe đạp theo nhóm nhằm tổ
                chức các hoạt động tuyên truyền, roadshow, teambuilding, du
                lịch... Với hình thức thuê xe sự kiện có thể hỗ trợ:
              </p>
              <ul className="list-disc  text-xl text-gray-800 pl-10">
                <li>
                  Cung cấp xe đạp cho các sự kiện, hoạt động cần số lượng xe
                  lớn.
                </li>
                <li>
                  Xe đạp gắn chia khóa thông minh có GPS kết nối với hệ thống
                  qua 3G / 4G.
                </li>
                <li>Xe được thiết kế phù hợp với mọi đối tượng.</li>
                <li>
                  Hỗ trợ vận chuyển xe tận nơi – Hỗ trợ mở sẵn khóa xe, tiện lợi
                  hơn cho sự kiện cần sử dụng số lượng lớn xe đạp.
                </li>
              </ul>
            </div>
            <div className="w-[50%] px-12  min-h-[300px] h-auto relative">
              <Image
                src={"https://tngo.vn/image/TNGO_rentBike.png"}
                alt="ảnh"
                className="mx-auto"
                width={448}
                height={300}
                style={{ objectFit: "cover" }}
              />
            </div>
            <div></div>
          </div>

          <div>
            <div className="px-12 mb-10">
              <h3 className="text-3xl font-bold">Bảng giá</h3>
            </div>
            <div className="flex">
              {/* xe đạp tngo */}
              <div className="px-12 pb-0.5 w-1/2 border-r-2 ">
                <div className="mx-auto text-center mb-10">
                  <h4 className="text-2xl font-semibold ">Xe đạp TNGo</h4>
                </div>
                <ul className="list-disc pl-20 text-lg ">
                  <li className="mb-3">
                    Thời lượng sử dụng dưới 3 tiếng: 50.000VNĐ/ xe/ ngày
                  </li>
                  <li className="mb-3">
                    Thời lượng sử dụng từ 3 - 5 tiếng: 80.000VNĐ/ xe/ ngày
                  </li>
                  <li className="mb-3">
                    Thời lượng sử dụng trên 5 tiếng: 100.000VNĐ/ xe/ ngày
                  </li>
                </ul>
              </div>
              {/* phí dịch dụ */}
              <div className="px-12 pb-0.5 w-1/2  ">
                <div className="mx-auto text-center mb-10">
                  <h4 className="text-2xl font-semibold ">Phí dịch dụ</h4>
                </div>
                <ul className="list-disc pl-20 text-lg ">
                  <li className="mb-3">Phí Xe qua đêm: 20.000 VNĐ/ xe/ đêm</li>
                  <li className="mb-3">
                    Phí vận chuyển theo từng tình hình thực tế cụ thể
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-5 mr-3 ml-12">
              <ul className="list-disc text-xl font-semibold space-y-2">
                <li>
                  💰 <strong>Giá gốc</strong>: Chưa bao gồm 8% VAT
                </li>
                <li>
                  📋 <strong>Tính toán giá</strong>:
                  <div className="text-sm font-normal ml-4 mt-1 bg-blue-50 p-2 rounded">
                    Ví dụ: 50.000 VNĐ + VAT (8%) = 54.000 VNĐ
                    <br />
                    Công thức: Giá gốc × 1.08 = Giá cuối cùng
                  </div>
                </li>
                <li>
                  🚚 <strong>Phí vận chuyển</strong>: Tính theo khoảng cách từ
                  chi nhánh gần nhất đến vị trí bàn giao xe
                  <div className="text-sm font-normal ml-4 mt-1 bg-green-50 p-2 rounded">
                    - Dưới 5km: Miễn phí
                    <br />
                    - 5km - 10km: 20.000 VNĐ
                    <br />
                    - 10km - 20km: 50.000 VNĐ
                    <br />- Trên 20km: Liên hệ để báo giá
                  </div>
                </li>
                <li>
                  ⏰ <strong>Khoảng thời gian</strong>: Thuê được tính trong 1
                  ngày từ 0h đến 24h
                </li>
                <li>
                  ⚙️ <strong>Tổng phí dịch vụ</strong>: Gồm giá xe + VAT + phí
                  vận chuyển (nếu có)
                </li>
                <li>
                  🎯 <strong>Bảng giá áp dụng</strong>: Cho sự kiện từ 5 xe trở
                  lên
                </li>
              </ul>
            </div>

            <div className="my-12 space-y-3.5">
              <p className="text-xl">
                Để biết thêm thông tin vui lòng liên hệ với Chúng tôi:
              </p>
              <h3 className="text-3xl font-bold">
                Công ty cổ phần dịch vụ Vận tải số Lê Bình
              </h3>
              <h5>
                <b className="text-xl"> Điện thoại:</b>{" "}
                <Link
                  href="tel:+84377590393"
                  target="_blank"
                  className="text-blue-700 cursor-pointer text-xl"
                >
                  0377590393
                </Link>{" "}
              </h5>
              <h5>
                <b className="text-xl"> Email:</b>

                <Link
                  href={"https://mail.google.com/"}
                  target="_blank"
                  className="text-blue-700 cursor-pointer text-xl"
                >
                  lebinh5112004@gmail.com
                </Link>
              </h5>
            </div>
          </div>
          <FormRegister />
        </div>
      </div>
      <div className="h-[1000px]"></div>
      <div></div>
    </>
  );
};

export default Rentbike;
