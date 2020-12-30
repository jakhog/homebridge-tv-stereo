# Making an Ex-Link cable for the Samsung UE46C5105
These cable plans are based on plans from [the SamyGO wiki](https://wiki.samygo.tv/index.php?title=Ex-Link_Cable_for_C/D/E_Series_and_BD_players).
You are going to need a VGA cable or connector like [this](https://www.kjell.com/no/produkter/data/datamaskinkomponenter/kontakter/d-sub-til-lodding-vga-hann-p39325).

You need to connect pin 4 (RX), pin 11 (TX) and pin 7 or 5,6,8 (GND) of the connector.
The pinout seen from the pin side of the connector is:

```
___________________________________
\                                 /
 \    ( 1) ( 2) ( 3) ( 4) ( 5)   /
  \ ( 6) ( 7) ( 8) ( 9) (10)    /
   \  (11) (12) (13) (14) (15) /
    \_________________________/
```
Do yourself a favour and pull out the unused pins, so you are left with:
```
___________________________________
\                                 /
 \                   (RX)        /
  \      (GND)                  /
   \  (TX)                     /
    \_________________________/
```

The wiki explains how to build a 3V3 to 5V level shifter, or you could by something like [this](https://www.sparkfun.com/products/12009).
However, in my experience connecting the cable directly to an Arduino Uno or Leonardo has not damaged the TV.

## Enabling the UART on the Samsung UE46C5105
The UART is hidden in the VGA PC port on the back of the TV, so connect your fresh cable to that port and get your remote ready to enable it:
1. Power off the TV
2. Press `INFO`, `MENU`, `MUTE`, `POWER` on the remote
3. The TV should power up in Service Mode with a menu on the screen that you can navigate with the remote
4. Go to `Control` -> `Sub Option`
5. Set the `RS-232 Jack` -> `UART`

The serial port can also be used for other interesting things, like a debug interface.

> Note: the baud rate of the serial port is 9600

In the Service Mode, you can also configure other usefull things.
For example, if you enable _Hotel Mode_ you can configure the default volume and the _Power On Source_ which is nice if you usually use the same HDMI input.

## UART commands for the Samsung UE46C5105
The serial port (in _UART_ mode) works much like a remote, so you can send commands to the TV.
Samsung has luckily posted all the available commands on [this support page](https://www.samsung.com/us/support/troubleshooting/TSG01201603/).
If they for some reason get taken down, the ones I've used for this model is listed in the table below.

> Note: unfortunately it seems like the serial port is powered down when the TV is in standby mode, and I could not for the life of me get the Power On command to work.
> I've tried all the tricks I could find on the wide web, but no cigar.
> So for powering on this model, it seems like you need to use the IR after all (which makes this cable mostly pointless).

All commands are in total 7 bytes long.
The first two are always `0x08` `0x22`, and the last is a checksum calculated as the two's complement of bytes 1 through 6.
To calculate the checksum, sum up all the values of the command bytes, then perform a bitwise not on the sum and add 1.


| Category | Subcategory                   | Command                     | Value              | Byte 3   | Byte 4   | Byte 5   | Byte 6   |
|----------|-------------------------------|-----------------------------|--------------------|----------|----------|----------|----------|
| General  | Power                         | Power                       |                    | 0x00     | 0x00     | 0x00     | 0x00     |
|          |                               | Off                         |                    |          |          |          | 0x01     |
|          |                               | On                          |                    |          |          |          | 0x02     |
|          | Volume                        | Direct                      |                    | 0x01     | 0x00     | 0x00     | 0 - 100  |
|          |                               | Up                          |                    |          |          | 0x01     | 0x00     |
|          |                               | Down                        |                    |          |          | 0x02     | 0x00     |
|          | Mute                          |                             |                    | 0x02     | 0x00     | 0x00     | 0x00     |
|          | Channel                       | Direct                      |                    | 0x04     |          |          |          |
|          |                               | Continuous                  | Up                 | 0x03     | 0x00     | 0x01     | 0x00     |
|          |                               |                             | Down               |          |          | 0x02     | 0x00     |
| Input    | Source                        | TV                          | TV                 | 0x0a     | 0x00     | 0x00     | 0x00     |
|          |                               | AV                          | AV 1               |          |          | 0x01     | 0x00     |
|          |                               |                             | AV 2               |          |          |          | 0x01     |
|          |                               |                             | AV 3               |          |          |          | 0x02     |
|          |                               | S-Video                     | S-Video 1          |          |          | 0x02     | 0x00     |
|          |                               |                             | S-Video 2          |          |          |          | 0x01     |
|          |                               |                             | S-Video 3          |          |          |          | 0x02     |
|          |                               | Component                   | Component 1        |          |          | 0x03     | 0x00     |
|          |                               |                             | Component 2        |          |          |          | 0x01     |
|          |                               |                             | Component 3        |          |          |          | 0x02     |
|          |                               | PC                          | PC 1               |          |          | 0x04     | 0x00     |
|          |                               |                             | PC 2               |          |          |          | 0x01     |
|          |                               |                             | PC 3               |          |          |          | 0x02     |
|          |                               | HDMI                        | HDMI 1             |          |          | 0x05     | 0x00     |
|          |                               |                             | HDMI 2             |          |          |          | 0x01     |
|          |                               |                             | HDMI 3             |          |          |          | 0x02     |
|          |                               |                             | HDMI 4             |          |          |          | 0x03     |
|          |                               | DVI                         | DVI 1              |          |          | 0x06     | 0x00     |
|          |                               |                             | DVI 2              |          |          |          | 0x01     |
|          |                               |                             | DVI 3              |          |          |          | 0x02     |
| Picture  | Mode                          | Dynamic                     |                    | 0x0b     | 0x00     | 0x00     | 0x00     |
|          |                               | Standard                    |                    |          |          |          | 0x01     |
|          |                               | Movie                       |                    |          |          |          | 0x02     |
|          |                               | Natural                     |                    |          |          |          | 0x03     |
|          |                               | Cal-Night                   |                    |          |          |          | 0x04     |
|          |                               | Cal-Day                     |                    |          |          |          | 0x05     |
|          |                               | BD Wise                     |                    |          |          |          | 0x06     |
|          | BackLight                     |                             | 0 - 20             |          | 0x01     | 0x00     | 0 - 20   |
|          | Contrast                      |                             | 0 - 100            |          | 0x02     | 0x00     | 0 - 100  |
|          | Brightness                    |                             | 0 - 100            |          | 0x03     | 0x00     | 0 - 100  |
|          | Sharpness                     |                             | 0 - 100            |          | 0x04     | 0x00     | 0 - 100  |
|          | Color                         |                             | 0 - 10             |          | 0x05     | 0x00     | 0 - 100  |
|          | Tint                          | G/R                         |                    |          | 0x06     | 0x00     | 0 - 100  |
|          | Advanced Settings             | Black Tone                  | Off                |          | 0x07     | 0x00     | 0x00     |
|          |                               |                             | Dark               |          |          |          | 0x01     |
|          |                               |                             | Darker             |          |          |          | 0x02     |
|          |                               |                             | Darkest            |          |          |          | 0x03     |
|          |                               | Dynamic Contrast            | Off                |          |          | 0x01     | 0x00     |
|          |                               |                             | Low                |          |          |          | 0x01     |
|          |                               |                             | Medium             |          |          |          | 0x02     |
|          |                               |                             | HIgh               |          |          |          | 0x03     |
|          |                               | Shadow Detail               | -2 - 2             |          |          | 0x02     | -2 - 2   |
|          |                               | Gamma                       | -3 - 3             |          |          | 0x03     | -3 - 3   |
|          |                               | RGB Only Mode               | Off                |          |          | 0x05     | 0x00     |
|          |                               |                             | Red                |          |          |          | 0x01     |
|          |                               |                             | Green              |          |          |          | 0x02     |
|          |                               |                             | Blue               |          |          |          | 0x03     |
|          |                               | Color Space Auto            |                    |          |          | 0x06     | 0x00     |
|          |                               | Color Space Native          |                    |          |          |          | 0x01     |
|          |                               | White Balance R-Offset      |                    |          |          | 0x07     | 0 - 50   |
|          |                               | White Balance G-Offset      |                    |          |          | 0x08     | 0 - 50   |
|          |                               | White Balance B-Offset      |                    |          |          | 0x09     | 0 - 50   |
|          |                               | White Balance R-Gain        |                    |          |          | 0x0a     | 0 - 50   |
|          |                               | White Balance G-Gain        |                    |          |          | 0x0b     | 0 - 50   |
|          |                               | White Balance B-Gain        |                    |          |          | 0x0c     | 0 - 50   |
|          |                               | White Balance Reset         |                    |          |          | 0x0d     | 0x00     |
|          |                               | Flesh Tone                  | -15 - 15           |          |          | 0x0e     | -15 - 15 |
|          |                               | Edge Enhancement            | Off                |          |          | 0x0f     | 0x00     |
|          |                               |                             | On                 |          |          |          | 0x01     |
|          |                               | xvYCC                       | Off                |          |          | 0x10     | 0x00     |
|          |                               |                             | On                 |          |          |          | 0x01     |
|          | Picture Option                | Color Tone                  | Cool               |          | 0x0a     | 0x00     | 0x00     |
|          |                               |                             | Normal             |          |          |          | 0x01     |
|          |                               |                             | Warm 1             |          |          |          | 0x02     |
|          |                               |                             | Warm 2             |          |          |          | 0x03     |
|          |                               | Size                        | 16:9               |          |          | 0x01     | 0x00     |
|          |                               |                             | Zoom 1             |          |          |          | 0x01     |
|          |                               |                             | Zoom 2             |          |          |          | 0x02     |
|          |                               |                             | Wide Fit           |          |          |          | 0x03     |
|          |                               |                             | 4:3                |          |          |          | 0x04     |
|          |                               |                             | Screen Fit         |          |          |          | 0x05     |
|          |                               | Digital Noise Filter        | Off                |          |          | 0x02     | 0x00     |
|          |                               |                             | Low                |          |          |          | 0x01     |
|          |                               |                             | Medium             |          |          |          | 0x02     |
|          |                               |                             | High               |          |          |          | 0x03     |
|          |                               |                             | Auto               |          |          |          | 0x04     |
|          |                               |                             | Auto Visualization |          |          |          | 0x05     |
|          |                               | MPEG Noise Filter           | Off                |          |          | 0x03     | 0x00     |
|          |                               |                             | Low                |          |          |          | 0x01     |
|          |                               |                             | Medium             |          |          |          | 0x02     |
|          |                               |                             | High               |          |          |          | 0x03     |
|          |                               |                             | Auto               |          |          |          | 0x04     |
|          |                               | HDMI Black Level            | Normal             |          |          | 0x04     | 0x00     |
|          |                               |                             | Low                |          |          |          | 0x01     |
|          |                               | Film Mode                   | Off                |          |          | 0x05     | 0x00     |
|          |                               |                             | Auto 1             |          |          |          | 0x01     |
|          |                               |                             | Auto 2             |          |          |          | 0x02     |
|          | Picture Reset                 | Picture Reset               |                    |          | 0x0b     | 0x00     | 0x00     |
|          | 3D                            | 3D Mode                     | Off                |          | 0x0c     | 0x00     | 0x00     |
|          |                               |                             | 2D->3D             |          |          |          | 0x01     |
|          |                               |                             | Side By Side       |          |          |          | 0x02     |
|          |                               |                             | Top Bottom         |          |          |          | 0x03     |
|          |                               |                             | Line By Line       |          |          |          | 0x04     |
|          |                               |                             | Vertical Line      |          |          |          | 0x05     |
|          |                               |                             | Checker BD         |          |          |          | 0x06     |
|          |                               |                             | Frame Sequence     |          |          |          | 0x07     |
|          |                               | 3D->2D                      | Off                |          |          | 0x01     | 0x00     |
|          |                               |                             | On                 |          |          |          | 0x01     |
|          |                               | 3D View Point               |                    |          |          | 0x02     | -5 - 5   |
|          |                               | Depth                       |                    |          |          | 0x03     | 1 - 10   |
|          |                               | Picture Correction          |                    |          |          | 0x04     | 0x00     |
|          |                               | 3D Optimize                 |                    |          |          | 0x05     | -1 - 1   |
| Sound    | Mode                          | Standard                    |                    | 0x0c     | 0x00     | 0x00     | 0x00     |
|          | SRS TheaterSound (Valencia)   | Music                       |                    |          |          |          | 0x01     |
|          | Sound Mode (Trident)          | Movie                       |                    |          |          |          | 0x02     |
|          |                               | Clear Voice                 |                    |          |          |          | 0x03     |
|          |                               | Amplify                     |                    |          |          |          | 0x04     |
|          | Equalizer                     | Balance                     |                    |          | 0x01     | 0x00     | 0 - 20   |
|          |                               | 100hz                       |                    |          |          | 0x01     | 0 - 20   |
|          |                               | 300hz                       |                    |          |          | 0x02     | 0 - 20   |
|          |                               | 1khz                        |                    |          |          | 0x03     | 0 - 20   |
|          |                               | 3khz                        |                    |          |          | 0x04     | 0 - 20   |
|          |                               | 10khz                       |                    |          |          | 0x05     | 0 - 20   |
|          |                               | Reset                       |                    |          |          | 0x06     | 0x00     |
|          | SRS TruSurround XT - Valencia | Off                         |                    |          | 0x02     | 0x00     | 0x00     |
|          | Virtual Surrond - Trident     | On                          |                    |          |          |          | 0x01     |
|          | SRS TruDialog - Valencia      | Off                         |                    |          | 0x03     | 0x00     | 0x00     |
|          | Dialog Clarify - Trident      | On                          |                    |          |          |          | 0x01     |
|          | Preferred Language            | English                     |                    |          | 0x04     | 0x00     | 0x00     |
|          |                               | Spanish                     |                    |          |          |          | 0x01     |
|          |                               | French                      |                    |          |          |          | 0x02     |
|          |                               | Korean                      |                    |          |          |          | 0x03     |
|          |                               | Japanese                    |                    |          |          |          | 0x04     |
|          | Multi-Track Sound             | Mono                        |                    |          | 0x05     | 0x00     | 0x00     |
|          |                               | Stereo                      |                    |          |          |          | 0x01     |
|          |                               | SAP                         |                    |          |          |          | 0x02     |
|          | Auto Volume                   | Off                         |                    |          | 0x06     | 0x00     | 0x00     |
|          |                               | Normal                      |                    |          |          |          | 0x01     |
|          |                               | Night                       |                    |          |          |          | 0x02     |
|          | Speaker Select                | TV Speaker                  |                    |          | 0x07     | 0x00     | 0x00     |
|          |                               | External Speaker            |                    |          |          |          | 0x01     |
|          | Sound Select                  | Main                        |                    |          | 0x08     | 0x00     | 0x00     |
|          |                               | Sub                         |                    |          |          |          | 0x01     |
|          | Sound Reset (Single UI)       | Sound Reset                 |                    |          | 0x09     | 0x00     | 0x00     |