import React from 'react'
import Peer from 'peerjs'

import Video from './Video'
import PeersLogger from './PeersLogger'
import styles from './Peers.scss'

interface Props {
  id: string
  peerId: string
  logging: boolean
  onClose?: () => void
  onError?: (error: Error) => void
}

interface State {
  peerError?: Error
  connecting: boolean
  connection?: Peer.DataConnection
  incomingCall: boolean
  calling: boolean
  message: string
  localStream?: MediaStream
  remoteStream?: MediaStream
}

export default class Peers extends React.Component<Props, State> {
  private peer: Peer
  private mediaConnection: Peer.MediaConnection | undefined = undefined

  static defaultProps = {
    logging: false,
  }

  state = {
    peerError: undefined,
    connecting: false,
    connection: undefined,
    incomingCall: false,
    calling: false,
    message: '',
    localStream: undefined,
    remoteStream: undefined,
  }

  constructor(props: Props) {
    super(props)

    this.peer = this.initialisePeer(props.id)
  }

  componentDidMount() {
    this.initialiselocalStream()
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.id !== prevProps.id) {
      this.peer.destroy()
      this.peer = this.initialisePeer(this.props.id)
    }
  }

  componentWillUnmount() {
    if (!this.peer || !this.peer.destroyed) {
      this.peer.destroy()
    }
  }

  initialiselocalStream = () => {
    navigator.getUserMedia(
      { video: true, audio: true },
      (localStream: MediaStream) => {
        this.setState({ localStream })
      },
      error => {
        console.log('Failed to get local stream', error)
      }
    )
  }

  initialisePeer = (id: string) => {
    const peer = new Peer(id)

    peer.on('open', (id: string) => {
      if (this.props.logging) {
        console.log('🍐 open', id)
      }
    })

    peer.on('connection', (connection: Peer.DataConnection) => {
      if (this.props.logging) {
        console.log('🍐 connection', connection)
      }

      this.setState({ connection, peerError: undefined })
    })

    peer.on('disconnected', () => {
      if (this.props.logging) {
        console.log('🍐 disconnected')
      }

      if (!peer || !peer.destroyed) {
        peer.reconnect()
      }
    })

    peer.on('error', (error: Error) => {
      if (this.props.logging) {
        console.log('🍐 error', error)
      }

      this.setState({ peerError: error })

      if (this.props.onError) {
        this.props.onError(error)
      }
    })

    if (this.props.onClose || this.props.logging) {
      peer.on('close', () => {
        if (this.props.logging) {
          console.log('🍐 close')
        }

        if (this.props.onClose) {
          this.props.onClose()
        }
      })
    }

    peer.on('call', (mediaConnection: Peer.MediaConnection) => {
      if (this.props.logging) {
        console.log('🍐 call', mediaConnection)
      }

      this.mediaConnection = mediaConnection

      this.setState({ incomingCall: true })
    })

    if (this.props.logging) {
      console.log(`🍐 initialised`, peer)
    }

    return peer
  }

  handleRetry = () => {
    this.peer.reconnect()
  }

  handleCall = () => {
    if (this.peer && this.props.peerId && this.state.localStream) {
      const connection = this.peer.connect(this.props.peerId)
      this.setState({ connection })

      this.setState({ calling: true })
      const call = this.peer.call(this.props.peerId, this.state.localStream)

      call.on('stream', (remoteStream: MediaStream) => {
        this.setState({ remoteStream })
      })
    }
  }

  handleAnswer = () => {
    if (this.mediaConnection) {
      this.mediaConnection.answer(this.state.localStream) // Answer the call with an A/V stream.
      this.mediaConnection.on('stream', (remoteStream: MediaStream) => {
        this.setState({ remoteStream })
      })
    }

    this.setState({ incomingCall: false, calling: true })
  }

  sendMessage = (event: React.FormEvent<HTMLElement>) => {
    event.preventDefault()

    if (this.props.logging) {
      console.log('🍐 send message', this.state.connection, this.state.message)
    }

    const { connection, message } = this.state

    if (connection && message) {
      ;(connection as Peer.DataConnection).send(message)
      this.setState({ message: '' })
    }
  }

  handleMessageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ message: event.target.value })
  }

  render() {
    return (
      <>
        <div className={styles.controls}>
          <p>
            <strong>{this.props.id}</strong> connected to{' '}
            <strong>{this.props.peerId}</strong>
          </p>
          <div className={styles.toolbar}>
            {this.state.peerError && (
              <button onClick={this.handleRetry}>Retry</button>
            )}
            {this.state.incomingCall ? (
              <button onClick={this.handleAnswer}>Answer</button>
            ) : !this.state.calling ? (
              <button onClick={this.handleCall}>
                Call {this.props.peerId}
              </button>
            ) : null}
          </div>
          <PeersLogger connection={this.state.connection} />
        </div>
        {/* {this.state.connection && (
          <form onSubmit={this.sendMessage}>
            <input
              type="text"
              value={this.state.message}
              onChange={this.handleMessageChange}
            />
            <input type="submit" value="Send" />
          </form>
        )} */}
        <div className={styles.streams}>
          <Video
            className={styles.remoteStream}
            stream={this.state.remoteStream}
            autoPlay={true}
            playsInline={true}
          />
          <Video
            className={styles.localStream}
            stream={this.state.localStream}
            autoPlay={true}
            playsInline={true}
            muted={true}
          />
        </div>
      </>
    )
  }
}
