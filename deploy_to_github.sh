#!/usr/bin/env bash
# =============================================================================
# deploy_to_github.sh - Hướng dẫn & Tự động đẩy Web Mobile lên GitHub Pages
# =============================================================================

set -e

REPO_DIR="/data/data/com.termux/files/home/web"
cd "$REPO_DIR"

echo "==========================================================================="
echo "🚀 ĐẨY WEB MOBILE LÊN GITHUB & KÍCH HOẠT GITHUB PAGES MIỄN PHÍ"
echo "==========================================================================="

if [ -n "$1" ]; then
    REMOTE_URL="$1"
    echo "[*] Thiết lập GitHub Remote: $REMOTE_URL"
    git remote remove origin 2>/dev/null || true
    git remote add origin "$REMOTE_URL"
    echo "[*] Đang đẩy code lên branch main..."
    git push -u origin main --force
    echo ""
    echo "[✓] ĐÃ PUSH CODE LÊN GITHUB THÀNH CÔNG!"
    echo "👉 BƯỚC TIẾP THEO ĐỂ BẬT GITHUB PAGES:"
    echo "   1. Mở trang repo GitHub trên trình duyệt."
    echo "   2. Vào tab: Settings -> Pages (ở menu bên trái)."
    echo "   3. Tại 'Build and deployment':"
    echo "      - Source: Deploy from a branch"
    echo "      - Branch: chọn 'main' / folder: '/ (root)'"
    echo "      - Bấm 'Save'."
    echo "   4. Sau 1 phút, trang web sẽ public toàn cầu tại URL:"
    echo "      https://<username>.github.io/<tên-repo>/"
    echo "==========================================================================="
    exit 0
fi

# Nếu chưa truyền URL, kiểm tra gh CLI
if command -v gh >/dev/null 2>&1; then
    if gh auth status >/dev/null 2>&1; then
        echo "[*] Phát hiện GitHub CLI đã đăng nhập. Tự động tạo repo và push..."
        REPO_NAME="tra-cuu-vat-ly-12"
        gh repo create "$REPO_NAME" --public --source=. --push || true
        echo "[✓] Đã tạo repo và push thành công lên GitHub!"
        exit 0
    fi
fi

echo "CÁCH 1 (Khuyên dùng - Nhanh nhất):"
echo "  1. Vào https://github.com/new và tạo 1 repository mới (Public, ví dụ: 'tra-cuu-vat-ly-12')."
echo "  2. Chạy lệnh sau trên Termux để đẩy code lên:"
echo "     bash deploy_to_github.sh https://github.com/<tai_khoan_cua_ban>/tra-cuu-vat-ly-12.git"
echo ""
echo "CÁCH 2 (Dùng GitHub CLI):"
echo "  1. Chạy lệnh: gh auth login"
echo "  2. Làm theo hướng dẫn đăng nhập bằng trình duyệt hoặc token."
echo "  3. Chạy lại: bash deploy_to_github.sh"
echo "==========================================================================="
