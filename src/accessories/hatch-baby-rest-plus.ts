import { HatchBabyRestPlus } from '../hatch-baby-rest-plus'
import { hap, HAP } from '../hap'
import { distinctUntilChanged, map, take } from 'rxjs/operators'
import { Observable } from 'rxjs'

export class HatchBabyRestAccessory {
  constructor(
    private light: HatchBabyRestPlus,
    private accessory: HAP.Accessory
  ) {
    const { Service, Characteristic } = hap,
      lightService = this.getService(Service.Lightbulb),
      batteryService = this.getService(Service.BatteryService),
      speakerService = this.getService(Service.Speaker),
      accessoryInfoService = this.getService(Service.AccessoryInformation)

    this.registerCharacteristic(
      lightService.getCharacteristic(Characteristic.On),
      light.onIsPowered,
      on => light.setPower(on)
    )

    this.registerCharacteristic(
      lightService.getCharacteristic(Characteristic.Brightness),
      light.onBrightness,
      brightness => light.setBrightness(brightness)
    )

    this.registerCharacteristic(
      batteryService.getCharacteristic(Characteristic.BatteryLevel),
      light.onBatteryLevel
    )
    this.registerCharacteristic(
      batteryService.getCharacteristic(Characteristic.StatusLowBattery),
      light.onBatteryLevel.pipe(
        map(batteryLevel => (batteryLevel < 20 ? 1 : 0))
      )
    )
    batteryService
      .getCharacteristic(Characteristic.ChargingState)
      .updateValue(2) // "not chargeable". no way to detect if it is plugged in.

    this.registerCharacteristic(
      speakerService.getCharacteristic(Characteristic.Volume),
      light.onVolume,
      volume => light.setVolume(volume)
    )
    this.registerCharacteristic(
      speakerService.getCharacteristic(Characteristic.Mute),
      light.onVolume.pipe(map(volume => volume === 0)),
      mute => {
        light.setVolume(mute ? 0 : 50)
      }
    )

    accessoryInfoService
      .getCharacteristic(Characteristic.Manufacturer)
      .updateValue('Hatch Baby')
    accessoryInfoService
      .getCharacteristic(Characteristic.Model)
      .updateValue('Rest+')
    accessoryInfoService
      .getCharacteristic(Characteristic.SerialNumber)
      .updateValue('Unknown')

    this.registerCharacteristic(
      accessoryInfoService.getCharacteristic(Characteristic.FirmwareRevision),
      light.onState.pipe(map(state => state.deviceInfo.f))
    )
    this.registerCharacteristic(
      accessoryInfoService.getCharacteristic(Characteristic.Name),
      light.onState.pipe(map(state => state.name))
    )
  }

  getService(serviceType: HAP.Service) {
    const existingService = this.accessory.getService(serviceType)
    return existingService || this.accessory.addService(serviceType)
  }

  registerCharacteristic(
    characteristic: HAP.Characteristic,
    onValue: Observable<any>,
    setValue?: (value: any) => any
  ) {
    const getValue = () => onValue.pipe(take(1)).toPromise()

    characteristic.on('get', async (callback: any) => {
      callback(null, await getValue())
    })

    if (setValue) {
      characteristic.on('set', async (value: boolean, callback: any) => {
        callback()

        const currentValue = await getValue()
        if (value !== currentValue) {
          setValue(value)
        }
      })
    }

    onValue.pipe(distinctUntilChanged()).subscribe(value => {
      characteristic.updateValue(value)
    })
  }
}
