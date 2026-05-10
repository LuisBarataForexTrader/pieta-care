import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { marked } from 'marked'

const CONTENT_DIR = path.join(process.cwd(), 'content/guias')

export interface ArticleMeta {
  slug: string
  title: string
  description: string
  date: string
  category: 'guia' | 'comparar'
  keywords: string[]
  readingTime: number
}

export interface Article extends ArticleMeta {
  contentHtml: string
}

function readMeta(filename: string): ArticleMeta {
  const slug = filename.replace(/\.md$/, '')
  const raw = fs.readFileSync(path.join(CONTENT_DIR, filename), 'utf-8')
  const { data } = matter(raw)
  return {
    slug,
    title: data.title ?? '',
    description: data.description ?? '',
    date: data.date ?? '',
    category: data.category ?? 'guia',
    keywords: data.keywords ?? [],
    readingTime: data.readingTime ?? 5,
  }
}

export function getAllArticles(): ArticleMeta[] {
  if (!fs.existsSync(CONTENT_DIR)) return []
  return fs
    .readdirSync(CONTENT_DIR)
    .filter(f => f.endsWith('.md'))
    .map(readMeta)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getAllSlugs(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return []
  return fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md')).map(f => f.replace(/\.md$/, ''))
}

export async function getArticle(slug: string): Promise<Article | null> {
  const filePath = path.join(CONTENT_DIR, `${slug}.md`)
  if (!fs.existsSync(filePath)) return null
  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)
  // Strip the leading H1 — it's rendered separately in the page header
  const body = content.trim().replace(/^#\s+[^\n]+\n?/, '')
  const contentHtml = await marked(body, { gfm: true })
  return {
    slug,
    title: data.title ?? '',
    description: data.description ?? '',
    date: data.date ?? '',
    category: data.category ?? 'guia',
    keywords: data.keywords ?? [],
    readingTime: data.readingTime ?? 5,
    contentHtml,
  }
}
