const modules = import.meta.glob('../assets/images/**/*.{png,jpg,gif,webp,svg,mp4}', {
  eager: true,
  import: 'default',
});

// ../assets/images/ 이후의 경로만 추출
const relativePath = (path: string) => path.replace(/^.*\/assets\/images\//, '');
// 확장자 제거 유틸
const removeExt = (filename: string) => filename.replace(/\.[^/.]+$/, '');

export const imageMap: Record<string, string> = Object.fromEntries(
  Object.entries(modules).flatMap(([path, url]) => {
    const relPath = relativePath(path); // common/logo.png
    const noExt = removeExt(relPath); // common/logo
    return [
      [relPath, url as string], // 확장자 포함 키
      [noExt, url as string], // 확장자 없는 키
    ];
  })
);

export function getImageUrl(filename: string) {
  return imageMap[filename];
}
