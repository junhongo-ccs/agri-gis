export const phase1AreaGeojson = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { area_id: 'shinagawa' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [139.7318, 35.6189],
          [139.7375, 35.6188],
          [139.7428, 35.6241],
          [139.7421, 35.6299],
          [139.7364, 35.6311],
          [139.7312, 35.6270],
          [139.7318, 35.6189],
        ]],
      },
    },
    {
      type: 'Feature',
      properties: { area_id: 'oimachi' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [139.7268, 35.6021],
          [139.7336, 35.6019],
          [139.7351, 35.6077],
          [139.7294, 35.6108],
          [139.7248, 35.6078],
          [139.7268, 35.6021],
        ]],
      },
    },
    {
      type: 'Feature',
      properties: { area_id: 'shiba_park_tokyo_tower' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [139.7412, 35.6528],
          [139.7486, 35.6525],
          [139.7517, 35.6587],
          [139.7484, 35.6643],
          [139.7415, 35.6640],
          [139.7394, 35.6585],
          [139.7412, 35.6528],
        ]],
      },
    },
    {
      type: 'Feature',
      properties: { area_id: 'odaiba' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [139.7680, 35.6195],
          [139.7938, 35.6188],
          [139.8012, 35.6341],
          [139.7927, 35.6488],
          [139.7719, 35.6479],
          [139.7638, 35.6345],
          [139.7680, 35.6195],
        ]],
      },
    },
  ],
}
