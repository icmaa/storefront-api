export type Product = {
  id: number,
  attributes_metadata?: Attribute<Option>[],
  [key: string]: unknown
}

export type Attribute<O> = {
  id: number,
  attribute_id: number,
  attribute_code: string,
  frontend_label: string,
  default_frontend_label?: string,
  frontend_input: string,
  is_visible: boolean,
  is_visible_on_front: boolean,
  is_comparable: boolean,
  options: O[],
  entity_type_id: number,
  is_user_defined: boolean
}

export type Option = {
  label: string,
  value: string | number,
  sort_order: number
}

export function getAttributesFromProductsAttributesMetaData (items: { _source: Product }[]): Attribute<Option>[] {
  const attributes = {}
  items.forEach(({ _source: item }) => {
    if (!item.attributes_metadata) return
    item.attributes_metadata.forEach(attr => {
      if (!item[attr.attribute_code]) return
      if (attributes[attr.attribute_code]) {
        const options = [attributes[attr.attribute_code].options, ...attr.options]
          .reduce((acc: Option[], option: Option): Option[] => {
            const found = acc.find(o => o.value === option.value)
            if (!found) acc.push(option)
            return acc
          }) as Option[]
        attributes[attr.attribute_code].options = options
      } else {
        attributes[attr.attribute_code] = attr
      }
    })

    delete item.attributes_metadata
  })

  return Object.values(attributes)
}
