#include "Samsung.h"
#include "Arduino.h"

void Samsung::start(int baudRate)
{
  Serial1.begin(baudRate);
}

void Samsung::sendCommand(byte data[4])
{
  byte checksum = 0x08 + 0x22;
  for (int i = 0; i < 4; ++i)
  {
    checksum += data[i];
  }
  Serial1.write(0x08);
  Serial1.write(0x22);
  Serial1.write(data, 4);
  Serial1.write(~checksum+1);

  if (data[0] == 0x00 && data[1] == 0x00 && data[2] == 0x00 && data[3] == 0x02) {
    Serial1.write(0x0D);    
  }
}

bool Samsung::isPoweredOn()
{
  return digitalRead(0) == HIGH;
}
