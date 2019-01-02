import React from 'react'
import Peer from 'peerjs'

import PeersLogger from './PeersLogger'
import styles from './Peers.scss'

interface Props {
  id: string
  peerId: string
  logging: boolean
  onClose?: () => void
  onError?: (error: any) => void
}

interface Connection {
  send: (data: any) => void
}

interface State {
  id: string
  peerError?: Error
  connecting: boolean
  connection?: Connection
  calling: boolean
  message: string
}

export default class Peers extends React.Component<Props, State> {
  private peer: Peer
  private mediaConnection: any
  private streamIn = React.createRef<HTMLVideoElement>()
  private streamOut = React.createRef<HTMLVideoElement>()

  static defaultProps = {
    logging: false,
  }

  state = {
    id: '',
    peerError: undefined,
    connecting: false,
    connection: undefined,
    calling: false,
    message: ''
  }

  constructor(props: Props) {
    super(props)

    this.peer = this.initialisePeer(props.id)
  }

  componentDidUpdate() {
    if (this.props.id !== this.state.id) {
      this.peer.destroy()
      this.peer = this.initialisePeer(this.props.id)

      this.setState({id: this.state.id})
    }
  }

  componentWillUnmount() {
    if (!this.peer || !this.peer.destroyed) {
      this.peer.destroy()
    }
  }

  initialisePeer = (id: string) => {
    const peer = new Peer(id)

    peer.on('open', (id: string) => {
      if (this.props.logging) {
        console.log('🍐 open', id)
      }

      this.setState({ id })
    })

    peer.on('connection', (connection: any) => {
      if (this.props.logging) {
        console.log('🍐 connection', connection)
      }

      this.setState({connection, peerError: undefined })
    })

    peer.on('disconnected', () => {
      if (this.props.logging) {
        console.log('🍐 disconnected')
      }

      if (!peer || !peer.destroyed) {
        peer.reconnect()
      }
    })

    peer.on('error', (error: any) => {
      if (this.props.logging) {
        console.log('🍐 error', error)
      }

      this.setState({peerError: error})

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

    peer.on('call', (mediaConnection: any) => {
      if (this.props.logging) {
        console.log('🍐 call', mediaConnection)
      }

      this.mediaConnection = mediaConnection

      this.setState({ calling: true })
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
    if (this.peer && this.props.peerId) {
      const connection = this.peer.connect(this.props.peerId)
      this.setState({connection})

      navigator.getUserMedia(
        { video: true, audio: true },
        stream => {
          const videoNodeIn = this.streamIn.current!
          const videoNodeOut = this.streamOut.current!

          try {
            videoNodeOut.srcObject = stream
          } catch (error) {
            videoNodeOut.src = URL.createObjectURL(stream)
          }
          const call = this.peer.call(this.props.peerId, stream)

          call.on('stream', (remoteStream: any) => {
            videoNodeIn.srcObject = remoteStream
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
        const videoNodeIn = this.streamIn.current!
        const videoNodeOut = this.streamOut.current!


        try {
          videoNodeOut.srcObject = stream
        } catch (error) {
          videoNodeOut.src = URL.createObjectURL(stream)
        }

        this.mediaConnection.answer(stream) // Answer the call with an A/V stream.
        this.mediaConnection.on('stream', (remoteStream: any) => {
          videoNodeIn.srcObject = remoteStream
        })

        this.setState({ calling: false })
      },
      (error: any) => {
        console.log('Failed to get local stream', error)
      }
    )
  }

  sendMessage = (event: React.FormEvent<HTMLElement>) => {
    event.preventDefault()

    if (this.props.logging) {
      console.log('🍐 send message', this.state.connection, this.state.message)
    }

    const {connection, message} = this.state

    if (connection && message) {
      (connection as Connection).send(message)
      this.setState({ message: '' })
    }
  }

  handleMessageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ message: event.target.value })
  }

  render() {
    return (
      <>
        <div className={styles.toolbar}>
          <div>
            {this.state.peerError && (
              <button onClick={this.handleRetry}>Retry</button>
            )}
            {this.state.calling && (
              <button onClick={this.handleAnswer}>Answer</button>
            )}
          </div>
          <button onClick={this.handleCall}>Call {this.props.peerId}</button>
        </div>
        <PeersLogger connection={this.state.connection} />
        <div className={styles.streams}>
          <video className={styles.streamIn} ref={this.streamIn} autoPlay={true} />
          <video className={styles.streamOut} ref={this.streamOut} autoPlay={true} />
        </div>
        {this.state.connection && <form onSubmit={this.sendMessage}>
          <input
            type="text"
            value={this.state.message}
            onChange={this.handleMessageChange}
          />
          <input type="submit" value="Send" />
        </form>}
      </>
    )
  }
}
