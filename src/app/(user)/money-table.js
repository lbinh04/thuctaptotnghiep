import React from "react";
import { useState, useEffect } from "react";
import useFetchGetData from "@/hooks/useFecthGetData";
import { FaArrowAltCircleRight } from "react-icons/fa";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertPayment } from "@/components/Alertpayment";
import DialogCount from "@/components/dialog-count";
import formatMoney from "@/components/format-money";
const MoneyTable = (props) => {
  const { token } = props;
  const [price, setPrice] = useState();
  const [point, setPoint] = useState(0);
  const [priceItem, setPriceItem] = useState(0);
  const [open, setOpen] = useState(false);
  const [postUrl, setPostUrl] = useState(``);
  const [name, setName] = useState("");
  const [id, setId] = useState("");

  const urlPrice = process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/auth/price/getPrice`
    : "http://localhost:3000/api/auth/price/getPrice";
  const {
    data: priceList,
    loading,
    error: priceError,
  } = useFetchGetData(urlPrice);

  // Mệnh giá VND
  const moneyDenominations = {
    10000: "10.000 đ",
    20000: "20.000 đ",
    50000: "50.000 đ",
    100000: "100.000 đ",
    200000: "200.000 đ",
    500000: "500.000 đ",
  };

  useEffect(() => {
    if (priceList) {
      setPrice(priceList.price);
    }
  }, [priceList]);

  const handleOnClickId = (item) => {
    setOpen(true);
    setId(item.id);
    setPriceItem(item.phi_nap);
    setPoint(item.diem_tngo);
  };
  useEffect(() => {
    if (id) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      setPostUrl(`${apiUrl}/api/auth/update-points?id=${id}`);
      console.log(
        "💰 Money table postUrl set to:",
        `${apiUrl}/api/auth/update-points?id=${id}`
      );
    }
  }, [id]);

  return (
    <div className="p-10">
      <div className="w-[1320px] mx-auto px-10">
        <h2 className=" text-blue-700 text-4xl my-9 font-bold text-center">
          {" "}
          Bạn đang thiếu điểm đúng ko ?
        </h2>

        <div>
          <Table>
            <TableCaption>A list of your recent invoices.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">STT</TableHead>
                <TableHead className={"text-end"}>Số tiền</TableHead>
                <TableHead></TableHead>
                <TableHead className={"text-end"}>Điểm TNGO</TableHead>
                <TableHead className="text-end">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {price && price?.length > 0 ? (
                price?.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className={"text-end"}>
                      <div className="flex items-center justify-end gap-3">
                        <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-6 py-3 rounded-lg font-bold text-lg shadow-lg">
                          💵{" "}
                          {moneyDenominations[item.phi_nap] ||
                            item.phi_nap + " đ"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className={""}>
                      <div className="">
                        <FaArrowAltCircleRight className=" block text-xl text-blue-500 ml-auto " />
                      </div>
                    </TableCell>

                    <TableCell className={"text-end"}>
                      {" "}
                      {formatMoney(item.diem_tngo)}
                    </TableCell>
                    <TableCell className="text-end">
                      {token ? (
                        <button
                          className="py-3 px-3 bg-blue-500 rounded-xl text-white hover:bg-blue-800 transition duration-200 ease-in-out cursor-pointer"
                          onClick={() => {
                            handleOnClickId(item);
                          }}
                        >
                          Mua ngay!!!
                        </button>
                      ) : (
                        <button className="py-3 px-3 bg-blue-500 rounded-xl text-white hover:bg-blue-800 transition duration-200 ease-in-out cursor-pointer">
                          đăng nhập để mua
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell className="font-medium col-span-4 text-xl text-gray-300 text-center uppercase">
                    ko có dữ liệu
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      {id && (
        <DialogCount
          open={open}
          setOpen={setOpen}
          name={name}
          postUrl={postUrl}
          price={priceItem}
          point={point}
          id={id}
        />
      )}
    </div>
  );
};

export default MoneyTable;
