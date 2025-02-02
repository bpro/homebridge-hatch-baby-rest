import { hap, isTestHomebridge } from './hap'
import { distinctUntilChanged } from 'rxjs/operators'
import { Observable, of } from 'rxjs'
import {
  Characteristic as CharacteristicClass,
  CharacteristicEventTypes,
  CharacteristicSetCallback,
  CharacteristicValue,
  PlatformAccessory,
  Service as ServiceClass,
  WithUUID,
} from 'homebridge'

export interface BaseDevice {
  name: string
  macAddress: string
  model: string
  onFirmwareVersion?: Observable<string>
}

export class BaseAccessory {
  constructor(
    private device: BaseDevice,
    protected accessory: PlatformAccessory
  ) {
    const { Service, Characteristic } = hap,
      accessoryInfoService = this.getService(Service.AccessoryInformation)

    accessoryInfoService
      .getCharacteristic(Characteristic.Manufacturer)
      .updateValue('Hatch Baby')
    accessoryInfoService
      .getCharacteristic(Characteristic.Model)
      .updateValue(device.model)
    accessoryInfoService
      .getCharacteristic(Characteristic.SerialNumber)
      .updateValue(device.macAddress)

    this.registerCharacteristic(
      accessoryInfoService.getCharacteristic(Characteristic.FirmwareRevision),
      device.onFirmwareVersion || of('')
    )
    this.registerCharacteristic(
      accessoryInfoService.getCharacteristic(Characteristic.Name),
      of(device.name)
    )
  }

  getService(serviceType: WithUUID<typeof ServiceClass>, nameSuffix?: string) {
    let name = nameSuffix
      ? this.device.name + ' ' + nameSuffix
      : this.device.name

    if (isTestHomebridge) {
      name = 'TEST ' + name
    }

    const existingService = this.accessory.getService(serviceType)
    return existingService || this.accessory.addService(serviceType, name)
  }

  registerCharacteristic(
    characteristic: CharacteristicClass,
    onValue: Observable<any>,
    setValue?: (value: any) => any
  ) {
    if (setValue) {
      characteristic.on(
        CharacteristicEventTypes.SET,
        (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
          callback()
          setValue(value)
        }
      )
    }

    onValue.pipe(distinctUntilChanged()).subscribe((value) => {
      characteristic.updateValue(value)
    })
  }
}
