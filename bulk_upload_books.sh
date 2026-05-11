#!/bin/bash

UPLOAD_API="https://elibrary-api.nortonu.app/api/uploads/single"
BOOK_API="https://elibrary-api.nortonu.app/api/books"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJ1c2VybmFtZSI6InNhbW5hbmdjaGFuIiwiZW1haWwiOiJzYW1uYW5nZ2NoYW5AZ21haWwuY29tIiwic3R1ZGVudElkIjoiQjIwMjMxNTc5Iiwicm9sZXMiOlsiYWRtaW4iLCJMaWJyYXJpYW4iXSwiaWF0IjoxNzc3ODk5NDI0LCJleHAiOjE3ODA0OTE0MjR9.7uClC4Bla-QGfG17P-MeqF0TCQRrL8Nf8M8Gzmp7E8Q"

COVER_DIR="./books/cover"
PDF_DIR="./books/pdf"

# --- macOS COMPATIBLE FILE LISTING ---
# We loop through all .pdf files in the PDF directory
count=0
# Use a simple glob to iterate through files safely on macOS Bash 3.2
for pdf_file_path in "$PDF_DIR"/*.pdf; do
  
  # Check if files actually exist to avoid errors with empty directories
  [ -e "$pdf_file_path" ] || continue
  
  ((count++))

  # Get the filename only (e.g., "Fast API.pdf")
  random_pdf=$(basename "$pdf_file_path")
  
  # 1. Get the Base Name (e.g., "Fast API")
  base_name="${random_pdf%.*}"
  
  # 2. Find matching cover (tries .jpg, .png, .jpeg)
  random_cover=""
  for ext in jpg png jpeg; do
    if [ -f "$COVER_DIR/$base_name.$ext" ]; then
      random_cover="$base_name.$ext"
      break
    fi
  done

  # Skip if no matching cover is found
  if [ -z "$random_cover" ]; then
    echo "⚠️  Warning: No matching cover found for '$base_name'. Skipping..."
    continue
  fi

  # 3. Format Title for API (Remove underscores for the title)
  book_title="${base_name//_/ }"

  cover_path="$COVER_DIR/$random_cover"
  pdf_path="$PDF_DIR/$random_pdf"

  echo "======================================"
  echo "📤 Uploading ($count): $book_title"

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
  "description": "Auto-uploaded: $base_name",
  "coverUrl": "$cover_url",
  "pdfUrl": "$pdf_url",
  "pdfUrls": [],
  "pages": $(( (RANDOM % 300) + 50 )),
  "publishers": 2,
  "authors": 2,
  "editors": 8,
  "categoryId": 7,
  "departmentId": 6,
  "typeId": 1,
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