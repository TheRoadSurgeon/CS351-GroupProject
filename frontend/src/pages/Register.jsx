import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import AddressAutocomplete, { initGoogleMapsAPI } from '../components/AddressAutocomplete'
import './Auth.css'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [foodBankName, setFoodBankName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [mapsLoaded, setMapsLoaded] = useState(false)
  
  const { signUp } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    initGoogleMapsAPI()
      .then(() => setMapsLoaded(true))
      .catch((error) => console.error('Failed to load Google Maps:', error))
  }, [])

  const handleAddressSelect = (addressData) => {
    setAddress(addressData.address)
    setCity(addressData.city)
    setState(addressData.state)
    setPostalCode(addressData.postalCode)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!role) {
      setError('Please select a role')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    const phoneRegex = /^[\d\s\-\(\)]{10,}$/
    const digitsOnly = phone.replace(/\D/g, '')
    if (digitsOnly.length !== 10) {
      setError('Phone number must be exactly 10 digits')
      return
    }

    const stateRegex = /^[A-Z]{2}$/i
    if (!stateRegex.test(state)) {
      setError('State must be a 2-letter code (e.g., IL, CA, NY)')
      return
    }

    const zipRegex = /^\d{5}(-\d{4})?$/
    if (!zipRegex.test(postalCode)) {
      setError('Zip code must be 5 digits (e.g., 60616) or 5+4 format (e.g., 60616-1234)')
      return
    }

    if (role === 'Donor' && (!firstName || !lastName)) {
      setError('Please enter your first and last name')
      return
    }

    if (role === 'Food Bank' && !foodBankName) {
      setError('Please enter the food bank name')
      return
    }

    setLoading(true)

    const additionalData = {
      phone,
      address,
      city,
      state: state.toUpperCase(),
      postalCode,
      ...(role === 'Donor' 
        ? { first_name: firstName, last_name: lastName } 
        : { name: foodBankName })
    }

    const { data, error } = await signUp(email, password, role, additionalData)
    const userId = data?.user?.id;
    
    if (error) {
      setError(error)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    }
  }

  return (
    <div className="auth-container">
      <h1 className="app-name">RESTOCKD</h1>
      <div className="auth-card">
        <h2>Register</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email<span className="required">*</span></label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password<span className="required">*</span></label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password (min 6 characters)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password<span className="required">*</span></label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirm your password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">I am a...<span className="required">*</span></label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="">-- Select Role --</option>
              <option value="Donor">Donor</option>
              <option value="Food Bank">Food Bank</option>
            </select>
          </div>

          {role === 'Donor' && (
            <>
              <div className="form-group">
                <label htmlFor="firstName">First Name<span className="required">*</span></label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  placeholder="Enter your first name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Last Name<span className="required">*</span></label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  placeholder="Enter your last name"
                />
              </div>
            </>
          )}

          {role === 'Food Bank' && (
            <div className="form-group">
              <label htmlFor="foodBankName">Food Bank Name<span className="required">*</span></label>
              <input
                id="foodBankName"
                type="text"
                value={foodBankName}
                onChange={(e) => setFoodBankName(e.target.value)}
                required
                placeholder="Enter food bank name"
              />
            </div>
          )}

          {role && (
            <>
              <div className="form-group">
                <label htmlFor="phone">Phone Number<span className="required">*</span></label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  pattern="[\d\s\-\(\)]{10,}"
                  title="Phone number must be 10 digits"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="address">Address<span className="required">*</span></label>
                {mapsLoaded ? (
                  <AddressAutocomplete onAddressSelect={handleAddressSelect} />
                ) : (
                  <input
                    id="address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Loading address autocomplete..."
                    disabled
                  />
                )}
              </div>

              <div className="form-row">
                <div className="form-group form-group-flex-2">
                  <label htmlFor="city">City<span className="required">*</span></label>
                  <input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Enter your city"
                    required
                  />
                </div>

                <div className="form-group form-group-flex-1">
                  <label htmlFor="state">State<span className="required">*</span></label>
                  <input
                    id="state"
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value.toUpperCase())}
                    placeholder="IL"
                    pattern="[A-Z]{2}"
                    maxLength="2"
                    title="Enter 2-letter state code (e.g., IL, CA, NY)"
                    required
                  />
                </div>

                <div className="form-group form-group-flex-1">
                  <label htmlFor="postalCode">Zip Code<span className="required">*</span></label>
                  <input
                    id="postalCode"
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="60616"
                    pattern="\d{5}(-\d{4})?"
                    title="Enter 5-digit zip code or 5+4 format (e.g., 60616 or 60616-1234)"
                    required
                  />
                </div>
              </div>
            </>
          )}

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">Registration successful! Redirecting to login...</div>}

          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <a href="/login">Login here</a>
        </p>
      </div>
    </div>
  )
}
