import { useEffect } from 'react'
import Router from 'next/router'
import nextCookie from 'next-cookies'
import cookie from 'js-cookie'
import api from './api'

export const login = ({ access_token }) => {
  cookie.set('token', access_token, { expires: 1 });
  console.log('login', typeof access_token, access_token);
  api.defaults.headers.Authorization = `Bearer ${access_token}`;
  Router.push('/forum')
}

export const isSignedIn = (ctx) => {
  const { token } = nextCookie(ctx);
  if (token === 'undefined') { return false; }
  return !!token;
}

export const setSession = (ctx) => {
  const { token } = nextCookie(ctx);
  // console.log('setSession', typeof token, token);
  if (token === 'undefined' || !token) { return null; }
  api.defaults.headers.Authorization = `Bearer ${token}`;
  return token;
}

export const auth = ctx => {
  const { token } = nextCookie(ctx)

  // If there's no token, it means the user is not logged in.
  if (!token) {
    if (typeof window === 'undefined') {
      ctx.res.writeHead(302, { Location: '/login' })
      ctx.res.end()
    } else {
      Router.push('/login')
    }
  }

  return token
}

export const logout = () => {
  cookie.remove('token')
  // to support logging out from all windows
  window.localStorage.setItem('logout', Date.now())
  Router.push('/')
}

export const withAuthSync = WrappedComponent => {
  const Wrapper = props => {
    const syncLogout = event => {
      if (event.key === 'logout') {
        console.log('logged out from storage!')
        Router.push('/login')
      }
    }

    useEffect(() => {
      window.addEventListener('storage', syncLogout)

      return () => {
        window.removeEventListener('storage', syncLogout)
        window.localStorage.removeItem('logout')
      }
    }, [])

    return <WrappedComponent {...props} />
  }

  Wrapper.getInitialProps = async ctx => {
    const token = auth(ctx)

    const componentProps =
      WrappedComponent.getInitialProps &&
      (await WrappedComponent.getInitialProps(ctx))

    return { ...componentProps, token }
  }

  return Wrapper
}
