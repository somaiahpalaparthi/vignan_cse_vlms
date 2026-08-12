const getApiBase = () => {
  if (typeof window !== 'undefined') {
    if (window.location.protocol === 'file:') {
      return 'http://localhost:5000/api';
    }
  }
  return '/api';
};

export const fetchAPI = async (endpoint, options = {}) => {
  const token = localStorage.getItem('vlms_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const primaryBase = getApiBase();
  const url = `${primaryBase}${endpoint}`;

  try {
    let response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
      });
    } catch (networkError) {
      // Fallback to absolute localhost:5000 if relative proxy fetch failed
      if (primaryBase === '/api') {
        const fallbackUrl = `http://localhost:5000/api${endpoint}`;
        response = await fetch(fallbackUrl, {
          ...options,
          headers,
        });
      } else {
        throw networkError;
      }
    }

    const text = await response.text();
    let data = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { message: text };
      }
    }

    if (!response.ok) {
      throw new Error(data.message || `Server error (Status ${response.status})`);
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
      throw new Error('Backend server is currently stopped. Please start the backend server to process API requests.');
    }
    throw err;
  }
};
