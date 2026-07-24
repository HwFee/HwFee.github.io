export interface Work {
  id: string
  title: string
  description: string
  tags: string[]
  source: string
  image: string
  addedAt: string
}

export interface SubCategory {
  name: string
  works: Work[]
}

export interface Category {
  name: string
  works: Work[]
  subcategories: SubCategory[]
  cover: Work
}
