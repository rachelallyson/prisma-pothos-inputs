import React from 'react'

export default {
  docsRepositoryBase: 'https://github.com/rachelallyson/prisma-pothos-inputs/tree/main/docs/content',
  footer: {
    text: `© ${new Date().getFullYear()} prisma-pothos-inputs`,
  },
  logo: <span>prisma-pothos-inputs</span>,
  project: {
    link: 'https://github.com/rachelallyson/prisma-pothos-inputs',
  },
  primaryHue: { dark: 200, light: 200 },
  sidebar: {
    defaultMenuCollapseLevel: 1,
    toggleButton: true,
  },
  search: {
    codeblocks: false,
    placeholder: 'Search documentation…',
  },
  toc: {
    backToTop: true,
  },
  navigation: {
    prev: true,
    next: true,
  },
}
