import { RestoreState } from '../shared/hatch-sleep-types'
import { distinctUntilChanged, map } from 'rxjs/operators'
import { BaseDevice } from '../shared/base-accessory'
import { IotDevice } from './iot-device'

export class RestoreIot extends IotDevice<RestoreState> implements BaseDevice {
  readonly model = 'RestoreIot'

  onSomeContentPlaying = this.onState.pipe(
    // map((state) => state.content.playing !== 'none'),
    // distinctUntilChanged()
  )

  onFirmwareVersion = this.onState.pipe(map((state) => state.deviceInfo.f))

  private setContent(
    playing: 'none', //RestoreState['content']['playing'],
    step: number
  ) {
    this.update({
      content: {
        playing,
        paused: false,
        offset: 0,
        step,
      },
    })
  }

  turnOnRoutine(step = 1) {
    // this.setContent('routine', step)
  }

  turnOff() {
    this.setContent('none', 0)
  }
}
