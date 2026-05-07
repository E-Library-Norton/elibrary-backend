#!/bin/bash

UPLOAD_API="https://elibrary-api.nortonu.app/api/uploads/single"
BOOK_API="https://elibrary-api.nortonu.app/api/books"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJ1c2VybmFtZSI6InNhbW5hbmdjaGFuIiwiZW1haWwiOiJzYW1uYW5nZ2NoYW5AZ21haWwuY29tIiwic3R1ZGVudElkIjoiQjIwMjMxNTc5Iiwicm9sZXMiOlsiYWRtaW4iLCJMaWJyYXJpYW4iXSwiaWF0IjoxNzc3ODk5NDI0LCJleHAiOjE3ODA0OTE0MjR9.7uClC4Bla-QGfG17P-MeqF0TCQRrL8Nf8M8Gzmp7E8Q"

COVER_DIR="./books/cover"
PDF_DIR="./books/pdf"

# macOS compatible random file picker
get_random_file() {
  local dir=$1
  ls "$dir" | python3 -c "import sys, random; lines = sys.stdin.readlines(); print(random.choice(lines).strip()) if lines else print('')" 2>/dev/null
}

for i in {1..500}; do

  # 1. Pick random files
  random_cover=$(get_random_file "$COVER_DIR")
  random_pdf=$(get_random_file "$PDF_DIR")
  
  if [ -z "$random_cover" ] || [ -z "$random_pdf" ]; then
    echo "⚠️ Error: Files not found in $COVER_DIR or $PDF_DIR."
    exit 1
  fi

  # 2. Extract Title from PDF filename (e.g., "document (1).pdf" -> "document (1)")
  # This uses shell parameter expansion to remove the extension
  book_title="${random_pdf%.*}"
  # Replace underscores with spaces for a cleaner look
  book_title="${book_title//_/ }"

  cover_path="$COVER_DIR/$random_cover"
  pdf_path="$PDF_DIR/$random_pdf"

  echo "======================================"
  echo "📤 Uploading ($i/500): $book_title"

  # ---------------- UPLOAD COVER ----------------
  cover_response=$(curl -s -X POST "$UPLOAD_API" \
    -H "Authorization: Bearer $TOKEN" \
    -F "file=@$cover_path")

  cover_url=$(echo "$cover_response" | jq -r '.data.url // .data.fileUrl // .url // empty')

  # ---------------- UPLOAD PDF ----------------
  pdf_response=$(curl -s -X POST "$UPLOAD_API" \
    -H "Authorization: Bearer $TOKEN" \
    -F "file=@$pdf_path")

  pdf_url=$(echo "$pdf_response" | jq -r '.data.url // .data.fileUrl // .url // empty')

  if [ -z "$cover_url" ] || [ -z "$pdf_url" ]; then
    echo "❌ Upload failed for $book_title. Skipping..."
    continue
  fi

  # ---------------- GENERATE ISBN ----------------
  isbn="978-$(printf "%02d-%06d-%01d" $((RANDOM%99)) $((RANDOM%999999)) $((RANDOM%9)))"

  # ---------------- CREATE BOOK ----------------
  json=$(cat <<EOF
{
  "title": "$book_title",
  "titleKh": "សៀវភៅ $book_title",
  "isbn": "$isbn",
  "publicationYear": 2026,
  "description": "Auto-uploaded from filename: $random_pdf",
  "coverUrl": "$cover_url",
  "pdfUrl": "$pdf_url",
  "pdfUrls": [],
  "pages": $(( (RANDOM % 300) + 50 )),
  "publishers": 1,
  "authors": 1,
  "editors": 3,
  "categoryId": 5,
  "departmentId": 4,
  "typeId": 2,
  "isActive": true
}
EOF
)

  book_creation=$(curl -s -X POST "$BOOK_API" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$json")

  echo "📘 Response: $book_creation"
  echo "✅ Success: $book_title"

done

echo "🎉 Process Complete!"