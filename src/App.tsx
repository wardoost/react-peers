import * as React from 'react'
import Peer from 'peerjs'

import ConnectionMessager from './components/ConnectionMessager'
import * as styles from './App.scss'

type Step = 'id' | 'peer' | 'connect'

interface State {
  step: Step
  id: string
  peerId: string
  peerError: any
  connecting: boolean
  connection: any
}

export default class App extends React.Component<{}, State> {
  peer: Peer | null = null

  state = {
    step: 'id' as Step,
    id: 'jan',
    peerId: 'joris',
    peerError: null,
    connecting: false,
    connection: null,
  }

  componentWillUnmount() {
    if (!this.peer || !this.peer.destroyed) {
      this.peer.destroy()
    }
  }

  handleIdSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    this.peer = new Peer(this.state.id)

    this.peer.on('open', (id: string) => {
      console.log('🍐 open', id)

      this.setState({ id })
    })

    this.peer.on('connection', (connection: any) => {
      console.log('🍐 connection', connection)

      this.setState({
        connection,
        peerError: null,
        step: 'connect',
      })
    })

    this.peer.on('disconnected', () => {
      console.log('🍐 disconnected')

      if (!this.peer || !this.peer.destroyed) {
        this.peer.reconnect()
      }
    })

    this.peer.on('error', (error: any) => {
      console.log('🍐 error', error)

      this.setState({
        peerError: error,
      })
    })

    this.peer.on('close', () => {
      console.log('🍐 close')

      this.setState({ step: 'peer' })
    })

    console.log(`🍐 initialised`, this.peer)

    this.setState({ step: 'peer' })
  }

  handlePeerSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (this.state.id && this.state.peerId) {
      const connection = this.peer.connect(this.state.peerId)

      this.setState({
        connection,
        step: 'connect',
      })
    }
  }

  handleSwap = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()

    this.setState(prevState => ({
      id: prevState.peerId,
      peerId: prevState.id,
    }))
  }

  handleBack = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()

    this.setState({ step: 'id' })
  }

  render() {
    if (this.state.step === 'id') {
      return (
        <div className={styles.container}>
          <form onSubmit={this.handleIdSubmit} className={styles.form}>
            <label>
              Your id
              <input
                type="text"
                value={this.state.id}
                onChange={event => this.setState({ id: event.target.value })}
              />
            </label>
            <input type="submit" value="Next" />
            <button onClick={this.handleSwap}>Swap</button>
          </form>
        </div>
      )
    }

    if (this.state.step === 'peer') {
      return (
        <div className={styles.container}>
          <div>
            You will connect as <strong>{this.state.id}</strong>
          </div>
          <form onSubmit={this.handlePeerSubmit} className={styles.form}>
            <label>
              Peer id
              <input
                type="text"
                value={this.state.peerId}
                onChange={event =>
                  this.setState({ peerId: event.target.value })
                }
              />
            </label>
            <input type="submit" value="Connect" />
            <button onClick={this.handleBack}>Back</button>
          </form>
        </div>
      )
    }

    return (
      <div className={styles.container}>
        <div>
          <strong>{this.state.id}</strong> connected to{' '}
          <strong>{this.state.peerId}</strong>
        </div>
        <div>
          {this.state.peerError ? (
            <button onClick={this.handleBack}>Retry</button>
          ) : (
            <ConnectionMessager connection={this.state.connection} />
          )}
        </div>
      </div>
    )
  }
}
