#!/bin/bash

in_path="$(pwd)/out"
out_path="$(pwd)/pdf"

for file in "$in_path"/*/*/*.md; do
	# if [[ -f "${file}" ]]; then
		echo "Converting $file to PDF..."
		dir_path="$(dirname "$file")"
		base_filename="$(basename "$file" .md)"
		(
			cd "$dir_path" || exit
			# todo: change pandoc latex variables to decrease margins
			pandoc "$base_filename.md" -o "$out_path/$base_filename.pdf"
		)
	# fi
done