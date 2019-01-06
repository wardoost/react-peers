import React from 'react'

interface Props extends React.HTMLProps<HTMLVideoElement> {
  stream?: MediaStream
}

export default class Peers extends React.Component<Props> {
  private video = React.createRef<HTMLVideoElement>()

  componentDidMount() {
    if (this.props.stream) {
      this.initialiseStream(this.props.stream)
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.stream && (!prevProps.stream || prevProps.stream.id! !== this.props.stream.id)) {
      this.initialiseStream(this.props.stream)
    }
  }

  initialiseStream = (stream: MediaStream) => {
    const videoNode = this.video.current!

    try {
      videoNode.srcObject = stream
    } catch (error) {
      videoNode.src = URL.createObjectURL(stream)
    }
  }

  render() {
    const { stream, ...rest } = this.props

    return <video ref={this.video} {...rest} />
  }
}
