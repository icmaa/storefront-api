import pick from 'lodash/pick'
import snakeCase from 'lodash/snakeCase'

const isEmailLinkType = (type) => type === 'email'

const schema = {
  nodes: {
    horizontalRule (): any {
      return {
        singleTag: 'hr'
      }
    },
    blockquote (): any {
      return {
        tag: 'blockquote'
      }
    },
    codeBlock (node): any {
      return {
        tag: [
          'pre',
          {
            tag: 'code',
            attrs: node.attrs
          }
        ]
      }
    },
    hardBreak (): any {
      return {
        singleTag: 'br'
      }
    },
    heading (node): any {
      return {
        tag: `h${node.attrs.level}`
      }
    },
    image (node): any {
      return {
        singleTag: [
          {
            tag: 'img',
            attrs: pick(node.attrs, ['src', 'alt', 'title'])
          }
        ]
      }
    },
    bulletList (): any {
      return {
        tag: 'ul'
      }
    },
    orderedList (): any {
      return {
        tag: 'ol'
      }
    },
    listItem (): any {
      return {
        tag: 'li'
      }
    },
    paragraph (): any {
      return {
        tag: 'p'
      }
    }
  },
  marks: {
    bold (): any {
      return {
        tag: 'b'
      }
    },
    strike (): any {
      return {
        tag: 'strike'
      }
    },
    underline (): any {
      return {
        tag: 'u'
      }
    },
    strong (): any {
      return {
        tag: 'strong'
      }
    },
    code (): any {
      return {
        tag: 'code'
      }
    },
    italic (): any {
      return {
        tag: 'i'
      }
    },
    link (node): any {
      const attrs = { ...node.attrs }
      const { linktype = 'url' } = node.attrs

      if (isEmailLinkType(linktype)) {
        attrs.href = `mailto:${attrs.href}`
      }

      if (attrs.anchor) {
        attrs.href = `${attrs.href}#${attrs.anchor}`
        delete attrs.anchor
      }

      return {
        tag: [
          {
            tag: 'a',
            attrs: attrs
          }
        ]
      }
    },
    styled (node): any {
      return {
        tag: [
          {
            tag: 'span',
            attrs: node.attrs
          }
        ]
      }
    }
  }
}

const polyfillCamelCaseNamesToSnakeCase = function (items: Record<string, any>): void {
  for (const key in items) {
    const scKey = snakeCase(key)
    if (key !== scKey) items[scKey] = items[key]
  }
}

polyfillCamelCaseNamesToSnakeCase(schema.nodes)
polyfillCamelCaseNamesToSnakeCase(schema.marks)

export default schema
