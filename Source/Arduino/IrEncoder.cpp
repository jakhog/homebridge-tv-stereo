#include "IrEncoder.h"
#include "Arduino.h"

void IrEncoder::start(int pin)
{
  this->pin = pin;
}

void IrEncoder::sendSamsungPulse(int pin, unsigned int duration)
{
  tone(pin, 38000);
  delayMicroseconds(duration);
  noTone(pin);
}

void IrEncoder::sendSamsungBit(int pin, byte data)
{
  this->sendSamsungPulse(pin, 325);
  if (data) delayMicroseconds(1620);
  else delayMicroseconds(510);
}

void IrEncoder::sendSamsung(byte device, byte subdevice, byte command)
{
  int pin = this->pin;
  
  this->sendSamsungPulse(pin, 2600);
  delayMicroseconds(4500);

  this->sendSamsungBit(pin, device & 0x01);
  this->sendSamsungBit(pin, device & 0x02);
  this->sendSamsungBit(pin, device & 0x04);
  this->sendSamsungBit(pin, device & 0x08);
  this->sendSamsungBit(pin, device & 0x10);
  this->sendSamsungBit(pin, device & 0x20);
  this->sendSamsungBit(pin, device & 0x40);
  this->sendSamsungBit(pin, device & 0x80);

  this->sendSamsungBit(pin, subdevice & 0x01);
  this->sendSamsungBit(pin, subdevice & 0x02);
  this->sendSamsungBit(pin, subdevice & 0x04);
  this->sendSamsungBit(pin, subdevice & 0x08);
  this->sendSamsungBit(pin, subdevice & 0x10);
  this->sendSamsungBit(pin, subdevice & 0x20);
  this->sendSamsungBit(pin, subdevice & 0x40);
  this->sendSamsungBit(pin, subdevice & 0x80);

  this->sendSamsungBit(pin, command & 0x01);
  this->sendSamsungBit(pin, command & 0x02);
  this->sendSamsungBit(pin, command & 0x04);
  this->sendSamsungBit(pin, command & 0x08);
  this->sendSamsungBit(pin, command & 0x10);
  this->sendSamsungBit(pin, command & 0x20);
  this->sendSamsungBit(pin, command & 0x40);
  this->sendSamsungBit(pin, command & 0x80);

  this->sendSamsungBit(pin, ~command & 0x01);
  this->sendSamsungBit(pin, ~command & 0x02);
  this->sendSamsungBit(pin, ~command & 0x04);
  this->sendSamsungBit(pin, ~command & 0x08);
  this->sendSamsungBit(pin, ~command & 0x10);
  this->sendSamsungBit(pin, ~command & 0x20);
  this->sendSamsungBit(pin, ~command & 0x40);
  this->sendSamsungBit(pin, ~command & 0x80);

  this->sendSamsungPulse(pin, 325);
}
