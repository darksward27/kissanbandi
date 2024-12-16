import React from 'react'
import HomeHero from './HomeHero'
import ProductCatalog from './ProductCatalog'
import HomeFeatures from './HomeFeatures'

export const Home = () => {
  return (
    <div>
        <HomeHero />
        <ProductCatalog />
        <HomeFeatures />
    </div>
  )
}
