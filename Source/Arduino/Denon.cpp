#include "Denon.h"
#include "Arduino.h"

void Denon::start(int dataPin, int powerPin)
{
  pinMode(dataPin, OUTPUT);
  digitalWrite(dataPin, LOW);
  this->dataPin = dataPin;
  pinMode(powerPin, INPUT);
  this->powerPin = powerPin;
}

void Denon::sendBits(uint16_t bits)
{
  for (int i = 0; i < 15; ++i)
  {
    digitalWrite(this->dataPin, HIGH);
    delayMicroseconds(320);
    digitalWrite(this->dataPin, LOW);
    if (bits & 0x1)
    {
      delayMicroseconds(1680);
    }
    else
    {
      delayMicroseconds(680);
    }
    bits >>= 1;
  }
  digitalWrite(this->dataPin, HIGH);
  delayMicroseconds(320);
  digitalWrite(this->dataPin, LOW);
}

void Denon::sendCommand(byte address, byte command)
{
  IrPacket normal;
  normal.fields.address = address;
  normal.fields.command = command;
  normal.fields.extra = 0;
  IrPacket inverted;
  inverted.fields.address = address;
  inverted.fields.command = ~command;
  inverted.fields.extra = ~0;

  this->sendBits(normal.data);
  delay(40);
  this->sendBits(inverted.data);
  delay(40);
}

bool Denon::isPoweredOn() {
  return digitalRead(this->powerPin) == HIGH;
}
