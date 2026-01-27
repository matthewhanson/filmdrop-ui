import React from 'react'
import './CollectionSection.css'
import CollectionDropdown from '../../../CollectionDropdown/CollectionDropdown'
import Section from '../Section/Section'

const CollectionSection = () => {
  return (
    <Section className="CollectionSection">
      <CollectionDropdown />
    </Section>
  )
}

export default CollectionSection
