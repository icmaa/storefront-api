import pick from 'lodash/pick'
import forEach from 'lodash/forEach'
import config from 'config'
import StoryblokClient from 'storyblok-js-client'
// import marked from 'marked'

const pluginMap: Record<string, any>[] = config.get('extensions.icmaaCms.storyblok.pluginFieldMap')
const metaFieldsToTransport = [{ id: 'story_id' }, { name: 'uname' }, 'uuid', 'published_at', 'created_at', 'first_published_at']

const getFieldMap = (key) => pluginMap.find(m => m.key === key)

let staticMarked: any = false
const marked = (string, options) => {
  if (!staticMarked) staticMarked = require('marked/lib/marked.js')
  return staticMarked(string, options)
}

export const extractPluginValues = async <T>(object: Record<string, any>): Promise<Record<string, any>> => {
  for (const key in object) {
    const v = object[key]
    if (v && typeof v === 'object') {
      if (v.plugin) {
        const map = getFieldMap(v.plugin)
        if (map) {
          const values = pick(v, map.values)
          object[key] = map.values.length === 1 ? Object.values(values)[0] : values
          if (v.plugin === 'icmaa-syntax-highlighter') {
            if (v.language === 'yaml') {
              object[key] = JSON.stringify(
                await import('yaml')
                  .then(m => m.default.parse(object[key]))
                  .catch(e => {
                    console.error('Error during YAML parsing in value mapping:', e)
                    return {}
                  })
              )
            }
          } else if (v.plugin === 'icmaa-rte') {
            object[key] = new StoryblokClient({}).richTextResolver.render(object[key])
          }
        }
      } else if (v.type === 'doc') {
        object[key] = new StoryblokClient({}).richTextResolver.render(object[key])
      } else if (Array.isArray(v) && v.some(c => c._uid !== undefined)) {
        for (const subObjectIndex in v.filter(c => c._uid !== undefined)) {
          v[subObjectIndex] = await extractPluginValues(v[subObjectIndex])
        }
      }
    }

    if (/(rte|markdown)$/.test(key)) {
      try {
        object[key] = marked(object[key], { gfm: true, breaks: true })
      } catch (err) {
        console.error('Error during Markdown parsing in value mapping:', err)
        object[key] = ''
      }
    }
  }

  return object
}

export const extractStoryContent = (object: Record<string, any>): Record<string, any> => {
  if (Object.values(object).length === 0) {
    return {}
  }

  const content = object.content
  metaFieldsToTransport.forEach((f) => {
    if (typeof f === 'object') {
      content[Object.values(f)[0]] = object[Object.keys(f)[0]]
    } else {
      content[f] = object[f]
    }
  })

  const regex = /^group_[\w]/
  forEach(content, (v, k) => {
    if (regex.exec(k) !== null) {
      delete content[k]
    }
  })

  return content
}
