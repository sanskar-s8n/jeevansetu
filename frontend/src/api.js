const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

async function request(endpoint, options = {}) {
  const { token, ...fetchOptions } = options;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(fetchOptions.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `API request failed: ${response.status}`);
  }

  return data;
}

export const api = {
  health() { return request('/health'); },
  getFacilities() { return request('/facilities'); },
  getFacility(id) { return request(`/facilities/${id}`); },

  createFacility(facility, token) {
    return request('/facilities', { method: 'POST', body: JSON.stringify(facility), token });
  },

  updateFacility(id, facility, token) {
    return request(`/facilities/${id}`, { method: 'PATCH', body: JSON.stringify(facility), token });
  },

  demoLogin(email = 'demo@jeevansetu.in') {
    return request('/auth/demo-login', { method: 'POST', body: JSON.stringify({ email }) });
  },

  createReferral(referral, token) {
    return request('/referrals', { method: 'POST', body: JSON.stringify(referral), token });
  },

  getReferrals(token) {
    return request('/referrals', { token });
  },

  getReferral(id, token) {
    return request(`/referrals/${id}`, { token });
  },

  updateReferralStatus(id, status, token) {
    return request(`/referrals/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
      token
    });
  }
};
