// src/Session.js
export function setSession(name, value, minutes) {
    const expires = new Date(Date.now() + minutes * 60 * 1000).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/`;
  }
  
  export function getSession(name) {
    const cookies = document.cookie.split("; ");
    for (let cookie of cookies) {
      const [key, val] = cookie.split("=");
      if (key === name) return val;
    }
    return null;
  }
  
  export function clearSession(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
  