import db from "@/db.js";

/**
 * GET /api/auth/station-bikes?stationId=1
 * Lấy thông tin số lượng xe tồn và đang thuê ở một trạm
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const stationId = searchParams.get("stationId");

    if (!stationId) {
      return new Response(JSON.stringify({ error: "stationId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Query để lấy thông tin xe theo loại và trạng thái
    const query = `
      SELECT 
        xe.loai_xe,
        SUM(CASE WHEN xe.trang_thai = 'Có sẵn' THEN 1 ELSE 0 END) as con_lai,
        SUM(CASE WHEN xe.trang_thai = 'Đang thuê' THEN 1 ELSE 0 END) as dang_thue,
        SUM(CASE WHEN xe.trang_thai = 'Bảo trì' THEN 1 ELSE 0 END) as bao_tri,
        COUNT(*) as tong_so
      FROM xe
      WHERE xe.id_tram = ?
      GROUP BY xe.loai_xe
    `;

    const [rows] = await db.query(query, [stationId]);

    // Format kết quả
    const result = {
      stationId: parseInt(stationId),
      bikes: {},
      total: {
        con_lai: 0,
        dang_thue: 0,
        bao_tri: 0,
        tong_so: 0,
      },
    };

    rows.forEach((row) => {
      result.bikes[row.loai_xe] = {
        con_lai: row.con_lai || 0,
        dang_thue: row.dang_thue || 0,
        bao_tri: row.bao_tri || 0,
        tong_so: row.tong_so || 0,
      };

      result.total.con_lai += row.con_lai || 0;
      result.total.dang_thue += row.dang_thue || 0;
      result.total.bao_tri += row.bao_tri || 0;
      result.total.tong_so += row.tong_so || 0;
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching station bikes:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
