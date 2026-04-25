import type { Lang } from '../types'

const t = {
  zh: {
    siteName: '小黑书',
    siteTagline: '为所有表达者',
    siteDesc: '记录真实生活体验的数字公共物品——非AI制造，只有人的感受。',
    heroTitle: '小黑书 · Xiaoheishu',
    heroSubtitle: '为所有表达者提供便利工具，记录真实的生活体验与感受',
    heroDesc: '非AI制造的真实内容。全球不同城市的生活故事，从美食到旅行，从日常到发现。',
    ctaJoin: '申请入驻',
    ctaLearn: '了解更多',
    latestStories: '最新故事',
    byAuthor: '作者',
    readMore: '阅读全文',
    backToTop: '返回主页',
    uploadTitle: '发布内容',
    uploadTitleField: '标题',
    uploadCityField: '城市',
    uploadContentField: '内容（支持 Markdown）',
    uploadImagesField: '图片',
    uploadSubmit: '发布',
    uploadPassword: '密码',
    uploadLogin: '登录',
    adminTitle: '管理后台',
    adminUsers: '用户管理',
    adminPosts: '内容管理',
    adminAddUser: '添加用户',
    noPostsYet: '暂无内容',
    aboutTitle: '关于小黑书',
    aboutP1: '小黑书是一个数字公共物品——为所有想要表达真实生活体验的人提供工具。',
    aboutP2: '初期专注于全球不同城市的生活体验：美食、街区、日常发现。后期扩展为更多表达形式，从表达者到创作者和创造者。',
    aboutP3: '所有内容由真实的人创作，非AI生成。',
    joinWaitlist: '加入候补名单',
    city: '城市',
    date: '日期',
    langSwitch: 'EN',
  },
  en: {
    siteName: 'Xiaoheishu',
    siteTagline: 'For All Expressers',
    siteDesc: 'A digital commons for real life experiences — not AI-generated, just human feelings.',
    heroTitle: 'Xiaoheishu · 小黑书',
    heroSubtitle: 'Tools for everyone to express real life experiences and feelings',
    heroDesc: 'Real content, not AI-generated. Life stories from cities around the world — food, neighborhoods, daily discoveries.',
    ctaJoin: 'Apply to Join',
    ctaLearn: 'Learn More',
    latestStories: 'Latest Stories',
    byAuthor: 'By',
    readMore: 'Read More',
    backToTop: 'Back to Home',
    uploadTitle: 'Publish Content',
    uploadTitleField: 'Title',
    uploadCityField: 'City',
    uploadContentField: 'Content (Markdown supported)',
    uploadImagesField: 'Images',
    uploadSubmit: 'Publish',
    uploadPassword: 'Password',
    uploadLogin: 'Login',
    adminTitle: 'Admin Panel',
    adminUsers: 'Users',
    adminPosts: 'Posts',
    adminAddUser: 'Add User',
    noPostsYet: 'No posts yet',
    aboutTitle: 'About Xiaoheishu',
    aboutP1: 'Xiaoheishu is a digital commons — tools for everyone who wants to express real life experiences.',
    aboutP2: 'Initially focused on life experiences from cities around the world: food, neighborhoods, daily discoveries. Later expanding to more expression formats.',
    aboutP3: 'All content created by real people, not AI.',
    joinWaitlist: 'Join Waitlist',
    city: 'City',
    date: 'Date',
    langSwitch: '中文',
  }
}

export function i18n(lang: Lang) {
  return t[lang]
}

export function detectLang(url: URL, acceptLanguage: string | null): Lang {
  if (url.searchParams.get('lang') === 'en') return 'en'
  if (url.searchParams.get('lang') === 'zh') return 'zh'
  if (acceptLanguage && !acceptLanguage.includes('zh')) return 'en'
  return 'zh'
}

export function toggleLangUrl(url: URL, currentLang: Lang): string {
  const u = new URL(url.toString())
  u.searchParams.set('lang', currentLang === 'zh' ? 'en' : 'zh')
  return u.toString()
}
