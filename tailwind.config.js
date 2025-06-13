module.exports = {
  darkMode: 'class',
  content: [
    './_includes/**/*.html',
    './_layouts/**/*.html',
    './_posts/*.md',
    './*.html',
    './*.md',
  ],
  safelist: [
    'text-4xl',
    'font-bold',
    'mt-8',
    'mb-4',
    'container',
    'mx-auto',
    'px-4',
    'py-8',
    'bg-gray-100',
    'text-gray-900',
    'dark:bg-gray-900',
    'dark:text-gray-100',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};