const pick = function (attrs, allowed) {
  if (!attrs) {
    return null
  }
  const h = {}
  for (const key in attrs) {
    const value = attrs[key]
    if (allowed.indexOf(key) > -1 && value !== null) {
      h[key] = value
    }
  }
  return h
}

const isEmailLinkType = (type) => type === 'email'

export default {
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
