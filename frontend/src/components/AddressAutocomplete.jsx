import { useEffect, useRef } from 'react'
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete'
import './AddressAutocomplete.css'

export default function AddressAutocomplete({ onAddressSelect }) {
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      componentRestrictions: { country: 'us' },
    },
    debounce: 300,
  })

  const handleInput = (e) => {
    setValue(e.target.value)
  }

  const handleSelect = async (description) => {
    clearSuggestions()

    try {
      const results = await getGeocode({ address: description })
      const { lat, lng } = await getLatLng(results[0])
      
      const addressComponents = results[0].address_components
      let address = '', city = '', state = '', postalCode = ''
      
      addressComponents.forEach(component => {
        const types = component.types
        if (types.includes('street_number')) {
          address = component.long_name + ' '
        }
        if (types.includes('route')) {
          address += component.long_name
        }
        if (types.includes('locality')) {
          city = component.long_name
        }
        if (types.includes('administrative_area_level_1')) {
          state = component.short_name
        }
        if (types.includes('postal_code')) {
          postalCode = component.long_name
        }
      })

      setValue(address.trim(), false)

      onAddressSelect({
        address: address.trim(),
        city,
        state,
        postalCode,
        lat,
        lng,
        fullAddress: description,
      })
    } catch (error) {
      console.error('Error getting geocode:', error)
    }
  }

  return (
    <div className="address-autocomplete">
      <input
        type="text"
        value={value}
        onChange={handleInput}
        disabled={!ready}
        placeholder="Enter your address"
        className="form-control"
        required
      />
      
      {status === 'OK' && (
        <ul className="suggestions-list">
          {data.map((suggestion) => {
            const {
              place_id,
              structured_formatting: { main_text, secondary_text },
            } = suggestion

            return (
              <li
                key={place_id}
                onClick={() => handleSelect(suggestion.description)}
                className="suggestion-item"
              >
                <strong>{main_text}</strong> <small>{secondary_text}</small>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export async function initGoogleMapsAPI() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  
  if (!apiKey) {
    console.error('Google Maps API key not found')
    return Promise.reject('API key missing')
  }

  if (window.google?.maps?.places) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.defer = true
    
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Maps script'))
    
    document.head.appendChild(script)
  })
}
