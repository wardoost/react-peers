import * as React from 'react'

import * as styles from './ConnectionMessager.scss'

interface Props {
  connection: any
}

interface State {
  connectionId: string
  connecting: boolean
  message: string
  messages: string[]
}

export default class ConnectionMessager extends React.Component<Props, State> {
  state = {
    connectionId: '',
    connecting: false,
    message: '',
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

    connection.on('data', (data: string) => {
      this.setState(prevState => ({
        messages: [...prevState.messages, data],
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

  sendMessage = (event: React.FormEvent<HTMLElement>) => {
    event.preventDefault()

    this.props.connection.send(this.state.message)
    this.setState({ message: '' })
  }

  handleMessageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ message: event.target.value })
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
        <form onSubmit={this.sendMessage}>
          <input
            type="text"
            value={this.state.message}
            onChange={this.handleMessageChange}
          />
          <input type="submit" value="Send" />
        </form>
      </div>
    )
  }
}
