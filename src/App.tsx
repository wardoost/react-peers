import * as React from 'react'
import Peer from 'peerjs'

import ConnectionMessager from './components/ConnectionMessager'
import * as styles from './App.scss'

navigator.getUserMedia =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia

type Step = 'id' | 'peer' | 'connect'

interface State {
  step: Step
  id: string
  peerId: string
  peerError: any
  connecting: boolean
  connection: any
  calling: boolean
}

export default class App extends React.Component<{}, State> {
  peer: Peer
  mediaConnection: any
  streamIn: HTMLVideoElement
  streamOut: HTMLVideoElement

  state = {
    step: 'id' as Step,
    id: 'jan',
    peerId: 'joris',
    peerError: null,
    connecting: false,
    connection: null,
    calling: false
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

    this.peer.on('call', (mediaConnection: any) => {
      console.log('🍐 call', mediaConnection)

      this.mediaConnection = mediaConnection

      this.setState({ calling: true })
    })

    console.log(`🍐 initialised`, this.peer)

    this.setState({ step: 'peer' })
  }

  handlePeerSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (this.peer && this.state.peerId) {
      this.connect()
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

  connect = () => {
    const connection = this.peer.connect(this.state.peerId)

    this.setState({
      connection,
      step: 'connect',
    })
  }

  handleCall = () => {
    if (this.peer && this.state.peerId) {
      this.connect()

      navigator.getUserMedia(
        { video: true, audio: true },
        stream => {
          try {
            this.streamOut.srcObject = stream
          } catch (error) {
            this.streamOut.src = URL.createObjectURL(stream)
          }
          const call = this.peer.call(this.state.peerId, stream)

          call.on('stream', (remoteStream: any) => {
            this.streamIn.srcObject = remoteStream
          })
        },
        error => {
          console.log('Failed to get local stream', error)
        }
      )
    }
  }

  handleAnswer = () => {
    navigator.getUserMedia(
      { video: true, audio: true },
      stream => {
        try {
          this.streamOut.srcObject = stream
        } catch (error) {
          this.streamOut.src = URL.createObjectURL(stream)
        }

        this.mediaConnection.answer(stream) // Answer the call with an A/V stream.
        this.mediaConnection.on('stream', (remoteStream: any) => {
          this.streamIn.srcObject = remoteStream
        })

        this.setState({ calling: false })
      },
      (error: any) => {
        console.log('Failed to get local stream', error)
      }
    )
  }

  renderStep() {
    switch (this.state.step) {
      case 'id':
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
      case 'peer':
        return (
          <>
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
              <button onClick={this.handleBack}>Back</button>
              <button onClick={this.handleCall}>Call</button>
              <input type="submit" value="Connect" />
            </form>
          </>
        )
      default:
        return (
          <>
            <div>
              <strong>{this.state.id}</strong> connected to{' '}
              <strong>{this.state.peerId}</strong>
            </div>
            <ConnectionMessager connection={this.state.connection} />
          </>
        )
    }
  }

  render() {
    return (
      <div className={styles.container}>
        <div className={styles.streams}>
          <video
            ref={ref => (this.streamIn = ref)}
            autoPlay={true}
          />
          <video
            ref={ref => (this.streamOut = ref)}
            autoPlay={true}
          />
        </div>
        <div>
          {this.state.peerError && (
            <button onClick={this.handleBack}>Retry</button>
          )}
          {this.state.calling && (
            <button onClick={this.handleAnswer}>Answer</button>
          )}
        </div>
        {this.renderStep()}
      </div>
    )
  }
}
