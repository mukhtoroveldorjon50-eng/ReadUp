export default function manifest() {
  return {
    name: 'ReadUp',
    short_name: 'ReadUp',
    description: 'Read articles and improve your English.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f6f7fb',
    theme_color: '#3b5bdb',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}
