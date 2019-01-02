import React from 'react'

import styles from './PeersLogger.scss'

interface Props {
  connection: any
}

interface State {
  connectionId: string
  connecting: boolean
  messages: string[]
}

export default class PeersLogger extends React.Component<Props, State> {
  state = {
    connectionId: '',
    connecting: false,
    messages: [],
  }

  static getDerivedStateFromProps(props: Props, state: State) {
    if (props.connection && props.connection.id !== state.connectionId) {
      return {
        connectionId: props.connection.id,
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
      this.props.connection.id !== this.state.connectionId
    ) {
      this.initialiseConnection(this.props.connection)
    }
  }

  initialiseConnection = (connection: any) => {
    this.setState({
      connectionId: connection.id,
      connecting: !connection.open,
      messages: [`📡 Connecting to ${connection.peer}...`]
    })

    connection.on('data', (data: any) => {
      this.setState(prevState => ({
        messages: [...prevState.messages, String(data)],
      }))
    })

    connection.on('error', (error: any) => {
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
