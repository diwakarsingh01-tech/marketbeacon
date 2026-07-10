#!/bin/bash
# MarketBeaconPro Image Optimization Script
# Converts images to WebP, resizes, and sets proper cache headers

set -e

echo "🖼️  Starting image optimization..."

# Install required tools
if ! command -v cwebp &> /dev/null; then
    echo "Installing WebP and ImageMagick..."
    sudo apt-get update
    sudo apt-get install -y webp imagemagick
fi

# Find and optimize images
find /var/www/html/wp-content/uploads -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) | while read -r file; do
    echo "Processing: $file"
    
    # Resize to max 1200px width, preserve aspect ratio
    convert "$file" -resize 1200 "$file"
    
    # Convert to WebP with 75% quality
    webp_path="${file%.*}.webp"
    cwebp -q 75 "$file" -o "$webp_path"
    
    # Remove original if WebP is smaller
    original_size=$(du -h "$file" | cut -f1)
    webp_size=$(du -h "$webp_path" | cut -f1)
    
    if [ "$webp_size" != "0B" ]; then
        # Compare sizes (crude comparison)
        if [[ "$webp_size" < "$original_size" ]]; then
            mv "$webp_path" "$file"
            echo "✅ Replaced with WebP"
        else
            rm "$webp_path"
            echo "⚠️  WebP larger, keeping original"
        fi
    else
        rm "$webp_path"
    fi
    
    # Set cache headers via .htaccess (if available)
    if [ -f "/var/www/html/.htaccess" ]; then
        cat >> /var/www/html/.htaccess << EOL

# WebP support
<IfModule mod_headers.c>
    <FilesMatch "\.(jpe?g|png)$">
        Header set Accept-Ranges "bytes"
    </FilesMatch>
    <FilesMatch "\.webp$">
        Header set Content-Type "image/webp"
        Header set Cache-Control "public, max-age=31536000, immutable"
    </FilesMatch>
</IfModule>
EOL
    fi
    
    done

echo "✅ Image optimization complete"
