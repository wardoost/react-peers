import React from 'react'
import Peer from 'peerjs'

import styles from './PeersLogger.scss'

interface Props {
  connection?: Peer.DataConnection
}

interface State {
  connectionLabel: string
  connecting: boolean
  messages: string[]
}

export default class PeersLogger extends React.Component<Props, State> {
  state = {
    connectionLabel: '',
    connecting: false,
    messages: [],
  }

  static getDerivedStateFromProps(props: Props, state: State) {
    if (props.connection && props.connection.label !== state.connectionLabel) {
      return {
        connectionLabel: props.connection.label,
        connecting: true,
      }
    }

    return null
  }

  componentDidMount() {
    if (this.props.connection) {
      this.initialiseConnection(this.props.connection)
    }
  }

  componentDidUpdate() {
    if (
      this.props.connection &&
      this.props.connection.label !== this.state.connectionLabel
    ) {
      this.initialiseConnection(this.props.connection)
    }
  }

  initialiseConnection = (connection: Peer.DataConnection) => {
    this.setState({
      connectionLabel: connection.label,
      connecting: !connection.open,
      messages: [`📡 Connecting to ${connection.peer}...`],
    })

    connection.on('data', (data: any) => {
      this.setState(prevState => ({
        messages: [...prevState.messages, String(data)],
      }))
    })

    connection.on('error', (error: Error) => {
      this.setState(prevState => ({
        messages: [
          ...prevState.messages,
          `📡 Connection error: ${error.message}`,
        ],
      }))
    })

    connection.on('open', () => {
      this.setState(prevState => ({
        messages: [...prevState.messages, '📡 Connection opened'],
        connecting: false,
      }))
    })

    connection.on('close', () => {
      this.setState(prevState => ({
        messages: [...prevState.messages, '📡 Connection closed'],
      }))
    })
  }

  render() {
    return (
      <div className={styles.container}>
        <code className={styles.messages}>
          {!this.state.messages.length
            ? `Waiting for messages...`
            : this.state.messages.map((message, index) => (
                <span key={index} className={styles.message}>
                  > {message}
                </span>
              ))}
        </code>
      </div>
    )
  }
}
