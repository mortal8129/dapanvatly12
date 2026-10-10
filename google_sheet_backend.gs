/**
 * =============================================================================
 * GOOGLE APPS SCRIPT BACKEND: ĐỒNG BỘ CẤU HÌNH & KẾT QUẢ THI VẬT LÍ 12
 * =============================================================================
 * 
 * HƯỚNG DẪN CÀI ĐẶT NHANH TRONG 1 PHÚT:
 * 1. Mở https://sheets.new để tạo một trang tính Google Sheet mới.
 * 2. Đặt tên trang tính: "Quản Lý Học Sinh & Cấu Hình - Vật Lí 12".
 * 3. Trên thanh menu, chọn: Tiện ích mở rộng (Extensions) -> Apps Script.
 * 4. Xóa toàn bộ mã mặc định và dán toàn bộ nội dung file này vào.
 * 5. Bấm "Triển khai" (Deploy) -> "Tùy chọn triển khai mới" (New deployment).
 *    - Loại triển khai: Ứng dụng web (Web app).
 *    - Mô tả: "Vật Lí 12 Sync API".
 *    - Thực thi dưới dạng (Execute as): "Tôi" (Me).
 *    - Ai có quyền truy cập (Who has access): "Bất kỳ ai" (Anyone).
 * 6. Bấm "Triển khai" và sao chép "URL ứng dụng web" (Web App URL).
 * 7. Dán URL này vào mục "Cài đặt Đồng Bộ Google" trên trang web Vật Lí 12.
 * =============================================================================
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    var rawData = e.postData ? e.postData.contents : "{}";
    var data = JSON.parse(rawData);
    var action = data.action || "save_config";
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (action === "save_config") {
      var sheet = getOrCreateSheet(ss, "User_Configs", [
        "Email", "Họ Tên", "Ảnh Đại Diện", "Giao Diện Yêu Thích", 
        "Chế Độ Màu", "Số Câu Đã Lưu", "Câu Đã Lưu (JSON)", 
        "Câu Hay Sai (JSON)", "Cấu Hình Toàn Phần (JSON)", "Thời Gian Cập Nhật"
      ]);
      
      var email = data.email || "";
      if (!email) {
        return createJsonResponse({ status: "error", message: "Email không được để trống" });
      }
      
      var rows = sheet.getDataRange().getValues();
      var rowIndex = -1;
      
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][0] && rows[i][0].toString().toLowerCase() === email.toLowerCase()) {
          rowIndex = i + 1; // 1-indexed
          break;
        }
      }
      
      var nowStr = Utilities.formatDate(new Date(), "Asia/Ho_Chi_Minh", "dd/MM/yyyy HH:mm:ss");
      var bookmarksArr = data.bookmarks || [];
      var wrongArr = data.wrongQuestions || [];
      
      var rowData = [
        email,
        data.name || "Học sinh",
        data.picture || "",
        data.preferredUI || "Fluid Motion Master",
        data.theme || "light",
        bookmarksArr.length,
        JSON.stringify(bookmarksArr),
        JSON.stringify(wrongArr),
        JSON.stringify(data.config || {}),
        nowStr
      ];
      
      if (rowIndex > 0) {
        sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
      } else {
        sheet.appendRow(rowData);
      }
      
      return createJsonResponse({
        status: "success",
        message: "Đã đồng bộ cấu hình thành công lên Google Sheets",
        updatedAt: nowStr
      });
    }
    
    else if (action === "save_exam") {
      var sheetExam = getOrCreateSheet(ss, "Exam_Results", [
        "Thời Gian", "Email", "Họ Tên", "Mã Đề", "Điểm Số / 10", 
        "Thời Gian Làm Bài", "Số Câu Đúng", "Tổng Số Câu", "Chi Tiết Bài Thi (JSON)"
      ]);
      
      var nowStrExam = Utilities.formatDate(new Date(), "Asia/Ho_Chi_Minh", "dd/MM/yyyy HH:mm:ss");
      var examRow = [
        nowStrExam,
        data.email || "Khách",
        data.name || "Ẩn danh",
        data.examCode || "Thi thử tổng hợp 28 câu",
        data.score || 0,
        data.duration || "50:00",
        data.correctCount || 0,
        data.totalQuestions || 28,
        JSON.stringify(data.details || {})
      ];
      
      sheetExam.appendRow(examRow);
      
      return createJsonResponse({
        status: "success",
        message: "Đã lưu kết quả bài thi thành công",
        score: data.score,
        savedAt: nowStrExam
      });
    }
    
    return createJsonResponse({ status: "error", message: "Hành động không hợp lệ" });
    
  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  try {
    var email = e && e.parameter ? e.parameter.email : "";
    var action = e && e.parameter ? e.parameter.action : "get_config";
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (action === "ping") {
      return createJsonResponse({
        status: "ok",
        message: "Google Sheet Cloud Sync Server Sẵn Sàng!",
        sheetName: ss.getName()
      });
    }
    
    if (action === "get_config" && email) {
      var sheet = ss.getSheetByName("User_Configs");
      if (!sheet) {
        return createJsonResponse({ status: "not_found", message: "Chưa có dữ liệu" });
      }
      
      var rows = sheet.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][0] && rows[i][0].toString().toLowerCase() === email.toLowerCase()) {
          var userConfig = {
            email: rows[i][0],
            name: rows[i][1],
            picture: rows[i][2],
            preferredUI: rows[i][3],
            theme: rows[i][4],
            bookmarks: parseJsonSafe(rows[i][6], []),
            wrongQuestions: parseJsonSafe(rows[i][7], []),
            config: parseJsonSafe(rows[i][8], {}),
            lastUpdated: rows[i][9]
          };
          return createJsonResponse({ status: "success", data: userConfig });
        }
      }
      return createJsonResponse({ status: "not_found", message: "Không tìm thấy cấu hình của người dùng" });
    }
    
    return createJsonResponse({ status: "error", message: "Vui lòng cung cấp tham số email hợp lệ" });
    
  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  }
}

function getOrCreateSheet(ss, sheetName, headers) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#e0f2fe");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function parseJsonSafe(str, fallback) {
  try {
    return JSON.parse(str);
  } catch(e) {
    return fallback;
  }
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
