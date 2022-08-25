import defaultHtmlSerializer from './schema'

/**
 * This is basically a copy of the richtext-resolver of the `storyblok-js-client` package.
 * We don't need the overhead from the rest of package, so we just copied this class.
 * @source https://github.com/storyblok/storyblok-js-client/blob/master/source/richTextResolver.js
 */

const escapeHTML = function (string) {
  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }

  const reUnescapedHtml = /[&<>"']/g
  const reHasUnescapedHtml = RegExp(reUnescapedHtml.source)

  return string && reHasUnescapedHtml.test(string)
    ? string.replace(reUnescapedHtml, (chr) => htmlEscapes[chr])
    : string
}

class RichTextResolver {
  marks = []
  nodes = []

  constructor (schema?) {
    if (!schema) {
      schema = defaultHtmlSerializer
    }

    this.marks = schema.marks || []
    this.nodes = schema.nodes || []
  }

  addNode (key: string, schema): void {
    this.nodes[key] = schema
  }

  addMark (key: string, schema): void {
    this.marks[key] = schema
  }

  render (data: Record<string, any> = {}): string {
    if (data.content && Array.isArray(data.content)) {
      let html = ''

      data.content.forEach((node) => {
        html += this.renderNode(node)
      })

      return html
    }

    console.warn(
      'The render method must receive an object with a content field, which is an array'
    )
    return ''
  }

  renderNode (item): string {
    const html = []

    if (item.marks) {
      item.marks.forEach((m) => {
        const mark = this.getMatchingMark(m)

        if (mark) {
          html.push(this.renderOpeningTag(mark.tag))
        }
      })
    }

    const node = this.getMatchingNode(item)

    if (node && node.tag) {
      html.push(this.renderOpeningTag(node.tag))
    }

    if (item.content) {
      item.content.forEach((content) => {
        html.push(this.renderNode(content))
      })
    } else if (item.text) {
      html.push(escapeHTML(item.text))
    } else if (node && node.singleTag) {
      html.push(this.renderTag(node.singleTag, ' /'))
    } else if (node && node.html) {
      html.push(node.html)
    }

    if (node && node.tag) {
      html.push(this.renderClosingTag(node.tag))
    }

    if (item.marks) {
      item.marks
        .slice(0)
        .reverse()
        .forEach((m) => {
          const mark = this.getMatchingMark(m)

          if (mark) {
            html.push(this.renderClosingTag(mark.tag))
          }
        })
    }

    return html.join('')
  }

  renderTag (tags, ending): string {
    if (tags.constructor === String) {
      return `<${tags}${ending}>`
    }

    const all = tags.map((tag) => {
      if (tag.constructor === String) {
        return `<${tag}${ending}>`
      } else {
        let h = `<${tag.tag}`
        if (tag.attrs) {
          for (const key in tag.attrs) {
            const value = tag.attrs[key]
            if (value !== null) {
              h += ` ${key}="${value}"`
            }
          }
        }

        return `${h}${ending}>`
      }
    })
    return all.join('')
  }

  renderOpeningTag (tags): string {
    return this.renderTag(tags, '')
  }

  renderClosingTag (tags): string {
    if (tags.constructor === String) {
      return `</${tags}>`
    }

    const all = tags
      .slice(0)
      .reverse()
      .map((tag) => {
        if (tag.constructor === String) {
          return `</${tag}>`
        } else {
          return `</${tag.tag}>`
        }
      })

    return all.join('')
  }

  getMatchingNode (item): any {
    if (typeof this.nodes[item.type] !== 'function') {
      return
    }
    return this.nodes[item.type](item)
  }

  getMatchingMark (item): any {
    if (typeof this.marks[item.type] !== 'function') {
      return
    }
    return this.marks[item.type](item)
  }
}

export default RichTextResolver
