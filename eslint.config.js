import antfu from '@antfu/eslint-config'

// 导出默认配置
export default antfu({
  // 启用严格规则
  strict: true,
  // 启用TypeScript规则
  typescript: true,
  // 启用React规则
  react: true,
  nextjs: true,
  // includes: [
  //   'src/**/*.{js,jsx,ts,tsx}',
  // ],
  // 配置忽略的文件
  ignores: [
    '**/node_modules',
    '**/dist',
    '**/.next',
    '**/build',
  ],
})
