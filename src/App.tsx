import React from 'react'

import Peers from './components/Peers'
import styles from './App.scss'

type Step = 'id' | 'peer' | 'connect'

interface State {
  step: Step
  id: string
  peerId: string
}

export default class App extends React.Component<{}, State> {
  state = {
    step: 'id' as Step,
    id: 'jan',
    peerId: 'joris',
  }

  goToStep = (step: Step) => (event: React.SyntheticEvent<HTMLElement>) => {
    event.preventDefault()

    this.setState({ step })
  }

  handleSwap = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()

    this.setState(prevState => ({
      id: prevState.peerId,
      peerId: prevState.id,
    }))
  }

  render() {
    switch (this.state.step) {
      case 'id':
        return (
          <div className={styles.container}>
            <div className={styles.heading}>
              Choose a username
            </div>
            <form onSubmit={this.goToStep('peer')} className={styles.form}>
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
          <div className={styles.container}>
            <div className={styles.heading}>
              Who are you connecting to?
            </div>
            <form onSubmit={this.goToStep('connect')} className={styles.form}>
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
              <button onClick={this.goToStep('id')}>Back</button>
            </form>
          </div>
        )
      default:
        return (
          <>
            <div>
              <strong>{this.state.id}</strong> connected to{' '}
              <strong>{this.state.peerId}</strong>
            </div>
            <Peers
              id={this.state.id}
              peerId={this.state.peerId}
              onClose={() => this.setState({ step: 'peer' })}
              logging={true}
            />
          </>
        )
    }
  }
}
