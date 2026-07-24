import os

images_dir = 'public/assets/images'
os.makedirs(images_dir, exist_ok=True)

svgs = {
    'dog.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#f0f0f0"/><text x="50" y="50" font-size="40" text-anchor="middle" dy=".3em">🐶</text></svg>',
    'cat.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#f0f0f0"/><text x="50" y="50" font-size="40" text-anchor="middle" dy=".3em">🐱</text></svg>',
    'apple.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#f0f0f0"/><text x="50" y="50" font-size="40" text-anchor="middle" dy=".3em">🍎</text></svg>',
    'school.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#f0f0f0"/><text x="50" y="50" font-size="40" text-anchor="middle" dy=".3em">🏫</text></svg>'
}

for filename, content in svgs.items():
    with open(os.path.join(images_dir, filename), 'w', encoding='utf-8') as f:
        f.write(content)

print(f"Created {len(svgs)} SVG placeholders in {images_dir}")
