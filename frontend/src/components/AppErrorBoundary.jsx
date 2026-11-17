import { Component } from 'react'

export default class AppErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('[Plenqora UI] An unexpected page error occurred.', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="auth-page">
          <section className="auth-card" role="alert">
            <h1>Plenqora couldn’t display this page</h1>
            <p className="auth-error">Something unexpected happened. Reload the page and try again. If it keeps happening, contact support.</p>
            <button className="button button-primary" type="button" onClick={() => window.location.reload()}>
              Reload page
            </button>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}
