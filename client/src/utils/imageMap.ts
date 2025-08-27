// 이미지 맵핑 유틸 함수
const modules = import.meta.glob('../assets/images/**/*.{png,jpg,gif,webp,svg,mp4}', {
  eager: true,
  import: 'default',
});
const basename = (path: string) => path.split('/').pop()!;

export const imageMap: Record<string, string> = Object.fromEntries(
  Object.entries(modules).map(([path, url]) => [basename(path), url as string])
);

export function getImageUrl(filename: string) {
  return imageMap[filename];
}
