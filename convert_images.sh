#!/bin/bash

# Function to process an individual file
process_file() {
    local input_file="$1"
    local output_prefix="$2"
    local height="$3"
    
    # Calculate width for a 3:4 aspect ratio
    local width=$((height * 3 / 4))
    
    # Convert and crop image to the specified aspect ratio
    convert "$input_file" \
        -resize x${height}^ \
        -gravity center \
        -crop ${width}x${height}+0+0 +repage \
        -unsharp 0x0.75+0.75+0.008 \
        -quality 90 \
        "${output_prefix}_${height}.webp"
}

# Loop over each specified resolution
for height in 1080 960 800 640 480 320; do
    # Loop over each input file provided as an argument
    for input_file in "$@"; do
        # Derive output prefix from the input file name (removes file extension)
        output_prefix="${input_file%.*}"
        
        process_file "$input_file" "$output_prefix" "$height"
    done
done

